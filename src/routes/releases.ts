import { OpenAPIRoute, type OpenAPIRouteSchema } from '@cloudflare/itty-router-openapi';
import { type Env } from '../env';
import { v4 as uuidv4 } from 'uuid';
import { type ZodError } from 'zod';
import { getCommitPRs, getCompare, getRefTag, getTagsList, type GhPullRequest } from '../services/github';
import { findPreviousTagName } from '../helpers/getPreviousVersionTag';
import { findGitHubRevert } from '../helpers/findGitHubRevert';
import { processGHPRBody } from '../helpers/processGHPRBody';
import { type RichRequest } from '../types/RichRequest';
import { fromZodError } from 'zod-validation-error';
import { error } from 'itty-router';
import { extractJiraIssueIdFromURL } from '../helpers/extractJiraIssueIdFromURL';
import { ReleaseObjectSchema } from '../types/ReleaseObjectSchema';
import { ReleaseNotesSchema } from '../types/ReleaseNotesSchema';
import { type ReleaseChange } from '../types/ReleaseChange';
import { type ReleaseNotes } from '../types/ReleaseNotes';
import { type ReleaseObject } from '../types/ReleaseObject';
import { TagNameSchema } from '../types/TagNameSchema';
import { ReleaseStubSchema } from '../types/ReleaseStubSchema';
import { type ReleaseStub } from '../types/ReleaseStub';
import { sendAdminSlackNotification } from '../services/slack';

export class PostRelease extends OpenAPIRoute<RichRequest> {
    static schema: OpenAPIRouteSchema = {
        responses: {
            '200': {
                description: 'Release response',
                schema: ReleaseStubSchema
            }
        },
        requestBody: ReleaseStubSchema
    }

    async handle(request: RichRequest, env: Env, context: ExecutionContext, data: { body: ReleaseStub }) {
        const id = uuidv4();
        const repo = `${data.body.repo}`;

        const head = data.body.head;
        let base = data.body.base;

        console.info(`Adding release ${id} from repo ${repo}`);

        // getting tags
        const tags = await getTagsList(repo, env);

        // checking from tag in refs

        const headRefTag = await getRefTag(head.name, repo, env);

        if (!headRefTag) {
            const error = `"head" tag was not found in repo references, check tag and repo names`;
            console.error(error);
            return new Response(error, { status: 500 });
        } else {
            // TODO get tagger from annotated tags?
            console.info(`Found "head" tag ${head.name} in repo ${repo} refs, it's ${headRefTag.object.type === "tag" ? "annotated" : "unannotated"}`);
        }

        // do we have to tag passed?
        let toTagName;

        if (base) {
            console.info(`We have "base" tag passed in request`);
            toTagName = base.name;
        } else {
            try {
                const tagNames = tags?.map(tag => tag.name) ?? [];
                console.info(`Don't have "base" tag passed in request, trying to find in latest tags`, JSON.stringify(tagNames));
                toTagName = TagNameSchema.parse(findPreviousTagName(tagNames, head.name));
            } catch (e) {
                const error = 'Error occcured during attempt to find "base" tag from previous tags';
                console.error(error, e);
                return new Response(error, { status: 500 });
            }

            base = {
                type: "tag",
                name: toTagName
            }

            console.info(`Found previous tag name ${toTagName}`);
        }

        const toRefTag = await getRefTag(toTagName, repo, env);

        if (!toRefTag) {
            const error = `"base" tag was not found in repo references, check tag and repo names`;
            console.error(error);
            return new Response(error, { status: 500 });
        } else {
            // TODO get tagger from annotated tags?
            console.info(`Found "base" tag ${toTagName} in repo ${repo} refs, it's ${toRefTag.object.type === "tag" ? "annotated" : "unannotated"}`);
        }

        // get compare

        const compare = await getCompare(toRefTag.object.sha, headRefTag.object.sha, repo, env);

        if (compare) {
            console.info(`"head" is ${compare.status} "base"${compare.commits.length ? ` by ${compare.commits.length} commits` : ''}`);
        } else {
            const error = `unable to compare base ${toRefTag.object.sha} and head ${headRefTag.object.sha}`;
            console.error(error);
            return new Response(error, { status: 500 });
        }

        if (compare.status !== "ahead") {
            const error = `"head" suppose to be head and suppose to be ahead of "base"`;
            console.error(error);
            return new Response(error, { status: 500 });
        }

        // getting a list of contributors
        const contributorsRaw = compare.commits.map(c => c.author.login ?? '');

        // fetching PRs

        let PRs: GhPullRequest[] = [];
        let PRIDs: number[] = []; // this is utility array for below procedures purposes

        for (const commit of compare.commits) {
            // It's expensive to run PR requests on ALL commits, so we will try to filter commits
            // TODO this should be more complex threshold to detect PR commits
            if (commit.commit.message.startsWith('Merge') || commit.commit.committer?.name === "GitHub") {
                // most likely this is a PR merge commit, try
                const commitPrs = await getCommitPRs(commit.sha, repo, env);

                if (commitPrs) {
                    commitPrs.forEach(pr => {
                        if (pr.state === "closed" && !PRIDs.includes(pr.id)) {
                            // add this PR
                            PRIDs.push(pr.id);
                            PRs.push(pr);
                        }
                    })
                }
            }
        }

        // exclude reverts from PRIDs
        PRs.forEach(pr => {
            const reverts = pr.body ? findGitHubRevert(pr.body) : undefined;
            if (reverts) {
                // remove PR itself
                PRIDs = PRIDs.filter(prid => prid !== pr.id)

                const revertedPR = PRs.find(p => p.url.includes(`${reverts.repo}/pulls/${reverts.prNumber}`));

                if (revertedPR) {
                    // remove reverted PR
                    PRIDs = PRIDs.filter(prid => prid !== revertedPR.id);
                }
            }
        })

        // now remove all PRs not present in PRIDs
        PRs = PRs.filter(pr => PRIDs.includes(pr.id))

        // TODO YOU ARE HERE!

        // generating release notes object

        const changes: ReleaseChange[] = [];

        PRs.forEach(pr => {
            const processedBody = processGHPRBody(`${pr.body}`, request.serviceConfig.allowedDemoDomains);

            const change: ReleaseChange = {
                pr,
                title: pr.title,
                body: processedBody.firstParagraph,
                demoUrls: processedBody.demoUrls,
                jiraUrls: processedBody.jiraUrls.map(url => ({url, issueId: extractJiraIssueIdFromURL(url) ?? "ISSUE"})),
                prUrl: pr.html_url,
                prNumber: pr.number,
            }

            changes.push(change);

            // conributors from pr
            if (pr.assignee?.login) contributorsRaw.push(pr.assignee?.login);
            if (pr.assignees?.length) pr.assignees.forEach(a => a.login && contributorsRaw.push(a.login));
            if (pr.requested_reviewers.length) pr.requested_reviewers.forEach(rr => rr.login && contributorsRaw.push(rr.login));

        })

        // filtering contributors
        const contributors = [...new Set(contributorsRaw)].filter(c => !c.includes('github'));

        let releaseNotes: ReleaseNotes;

        try {
            releaseNotes = ReleaseNotesSchema.parse({
                changes,
                contributors
            });
        } catch (e) {
            // TODO safe parse
            const validationError = fromZodError(e as ZodError);
            const errorMessage = `Created release notes isn't valid for some reason ${validationError.message}`;
            console.error(errorMessage);
            return error(500, errorMessage);
        }

        // storing release notes to DB

        const date = new Date();
        const createdAt = date.toISOString();
        date.setMinutes(date.getMinutes() + request.serviceConfig.notificationDelayMinutes);
        const queuedTo = date.toISOString();

        const refHeadRaw = JSON.stringify(head);
        const refBaseRaw = JSON.stringify(base);
        const releaseNotesRaw = JSON.stringify(releaseNotes);

        let releaseObject: ReleaseObject;

        const parseResult = ReleaseObjectSchema.safeParse({
            id,
            repo,
            head,
            base,
            createdAt,
            queuedTo,
            releaseNotes,
        });

        if (parseResult.success) {
            releaseObject = parseResult.data
        } else {
            const validationError = fromZodError(parseResult.error);
            const errorMessage = `Created release isn't valid for some reason ${validationError.message}`;
            console.error(errorMessage);
            return error(500, errorMessage);
        }

        const { success} = await env.DB.prepare(`
            insert into releases (id, repo, refHeadRaw, refBaseRaw, createdAt, queuedTo, releaseNotesRaw) values (?, ?, ?, ?, ?, ? ,?)
        `).bind(id, repo, refHeadRaw, refBaseRaw, createdAt, queuedTo, releaseNotesRaw).run();

        if (success) {

            //  build outputs and send them to services
            if (request.serviceConfig.notificationServices.includes("slack")) {
                await sendAdminSlackNotification(releaseObject, request.serviceConfig);
            }

            return new Response(JSON.stringify(releaseObject), { status: 200 })
        } else {
            return new Response("Something went wrong", { status: 500 })
        }
    }
}
