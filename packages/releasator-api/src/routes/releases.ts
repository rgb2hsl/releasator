import {OpenAPIRoute, type OpenAPIRouteSchema, Path} from "@cloudflare/itty-router-openapi";
import {type Env} from "../env";
import {z, type ZodError} from "zod";
import {getCommitPRs, getCompare, getRefTag, getTagsList} from "../services/github";
import {findPreviousTagName} from "../helpers/getPreviousVersionTag";
import {findGitHubRevert} from "../helpers/findGitHubRevert";
import {processGHPRBody} from "../helpers/processGHPRBody";
import {type RequestWithConfig, type RichRequest} from "../types/RichRequest";
import {fromZodError} from "zod-validation-error";
import {error} from "itty-router";
import {
    extractJiraIssueIdFromURL,
    type GhPullRequest,
    type ReleaseChange,
    ReleaseNotesSchema,
    type ReleaseObject,
    ReleaseObjectSchema,
    type ReleaseStub,
    ReleaseStubSchema,
    TagNameSchema
} from "releasator-types";
import {sendSlackNotification} from "../services/slack";
import {
    getQueuedReleaseObjects,
    getReleaseObjectById,
    insertReleaseObject,
    updateReleaseObject
} from "../domains/ReleaseObjectsDomain";
import {emojize} from "../helpers/emojize";

export class GetQueuedReleases extends OpenAPIRoute<RichRequest> {
    static schema: OpenAPIRouteSchema = {
        responses: {
            "200": {
                description: "Release response",
                schema: z.array(ReleaseStubSchema)
            }
        }
    };

    async handle(request: RichRequest, env: Env, context: ExecutionContext) {
        const getResult = await getQueuedReleaseObjects(env);

        if (getResult.success) {
            return new Response(JSON.stringify(getResult.data), {status: 200});
        } else {
            return new Response(JSON.stringify(getResult.error), {status: 500});
        }
    }
}


interface GetReleaseByIdForEditParams extends RequestWithConfig {
    params?: {
        id?: string;
        token?: string;
    };
}

export class GetReleaseByIdForEdit extends OpenAPIRoute<RichRequest> {
    static schema: OpenAPIRouteSchema = {
        responses: {
            "200": {
                description: "Release response",
                schema: ReleaseStubSchema
            }
        },
        parameters: {
            id: Path(z.string(), {
                description: "Release ID"
            }),
            token: Path(z.string(), {
                description: "Release editToken"
            })
        }
    };

    async handle(request: GetReleaseByIdForEditParams, env: Env, context: ExecutionContext) {
        const id = request.params?.id;
        const token = request.params?.token;

        if (!id) {
            const error = `GetReleaseById: id is undefined`;
            console.error(error);
            return new Response(error, {status: 500});
        }

        const getResult = await getReleaseObjectById(id, env);

        if (getResult.success) {

            if (token === getResult.data.editHash) {
                // disallowing getting already posted releases
                if (getResult.data.postedAt) {
                    return new Response("Method Not Allowed", {status: 405});
                }

                return new Response(JSON.stringify(getResult.data), {status: 200});
            } else {
                return new Response("Unauthorised", {status: 401});
            }

        } else {
            return new Response(JSON.stringify(getResult.error), {status: 500});
        }
    }
}

export class PostRelease extends OpenAPIRoute<RichRequest> {
    static schema: OpenAPIRouteSchema = {
        responses: {
            "200": {
                description: "Release response",
                schema: ReleaseObjectSchema
            }
        },
        requestBody: ReleaseStubSchema
    };

    async handle(request: RichRequest, env: Env, context: ExecutionContext, data: { body: ReleaseStub }) {
        const repo = `${data.body.repo}`;

        const head = data.body.head;
        let base = data.body.base;

        console.info(`Adding release ${head.name} from repo ${repo}`);

        // getting tags
        const tags = await getTagsList(repo, env);

        // checking from tag in refs

        const headRefTag = await getRefTag(head.name, repo, env);

        if (!headRefTag) {
            const error = `"head" tag was not found in repo references, check tag and repo names`;
            console.error(error);
            return new Response(error, {status: 500});
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
                const error = "Error occcured during attempt to find \"base\" tag from previous tags";
                console.error(error, e);
                return new Response(error, {status: 500});
            }

            base = {
                type: "tag",
                name: toTagName
            };

            console.info(`Found previous tag name ${toTagName}`);
        }

        const toRefTag = await getRefTag(toTagName, repo, env);

        if (!toRefTag) {
            const error = `"base" tag was not found in repo references, check tag and repo names`;
            console.error(error);
            return new Response(error, {status: 500});
        } else {
            // TODO get tagger from annotated tags?
            console.info(`Found "base" tag ${toTagName} in repo ${repo} refs, it's ${toRefTag.object.type === "tag" ? "annotated" : "unannotated"}`);
        }

        const compare = await getCompare(toRefTag.object.sha, headRefTag.object.sha, repo, env);

        if (compare) {
            console.info(`"head" is ${compare.status} "base"${compare.commits.length ? ` by ${compare.commits.length} commits` : ""}`);
        } else {
            const error = `unable to compare base ${toRefTag.object.sha} and head ${headRefTag.object.sha}`;
            console.error(error);
            return new Response(error, {status: 500});
        }

        if (compare.status !== "ahead") {
            const error = `"head" suppose to be head and suppose to be ahead of "base"`;
            console.error(error);
            return new Response(error, {status: 500});
        }

        // getting a list of contributors
        const contributorsRaw = compare.commits.map(c => c.author.login ?? "");

        // fetching PRs

        let PRs: GhPullRequest[] = [];
        let PRIDs: number[] = []; // this is utility array for below procedures purposes

        for (const commit of compare.commits) {
            // It's expensive to run PR requests on ALL commits, so we will try to filter commits
            // TODO this should be more complex threshold to detect PR commits
            if (commit.commit.message.startsWith("Merge") || commit.commit.committer?.name === "GitHub") {
                // most likely this is a PR merge commit, try
                const commitPrs = await getCommitPRs(commit.sha, repo, env);

                if (commitPrs) {
                    commitPrs.forEach(pr => {
                        if (pr.state === "closed" && !PRIDs.includes(pr.id)) {
                            // add this PR
                            PRIDs.push(pr.id);
                            PRs.push(pr);
                        }
                    });
                }
            }
        }

        // exclude reverts from PRIDs
        PRs.forEach(pr => {
            const reverts = pr.body ? findGitHubRevert(pr.body) : undefined;
            if (reverts) {
                // remove PR itself
                PRIDs = PRIDs.filter(prid => prid !== pr.id);

                const revertedPR = PRs.find(p => p.url.includes(`${reverts.repo}/pulls/${reverts.prNumber}`));

                if (revertedPR) {
                    // remove reverted PR
                    PRIDs = PRIDs.filter(prid => prid !== revertedPR.id);
                }
            }
        });

        // now remove all PRs not present in PRIDs
        PRs = PRs.filter(pr => PRIDs.includes(pr.id));

        // generating release notes object

        const changes: ReleaseChange[] = [];

        PRs.forEach(pr => {
            const processedBody = processGHPRBody(`${pr.body}`, request.serviceConfig.allowedDemoDomains);

            const change: ReleaseChange = {
                pr,
                title: emojize(pr.title, processedBody.firstParagraph) + "  " + pr.title,
                body: processedBody.firstParagraph,
                demoUrls: processedBody.demoUrls,
                jiraUrls: processedBody.jiraUrls.map(url => ({
                    url,
                    issueId: extractJiraIssueIdFromURL(url) ?? "ISSUE"
                })),
                prUrl: pr.html_url,
                prNumber: pr.number
            };

            changes.push(change);

            // conributors from pr
            if (pr.assignee?.login) contributorsRaw.push(pr.assignee?.login);
            if (pr.assignees?.length) pr.assignees.forEach(a => a.login && contributorsRaw.push(a.login));
            if (pr.requested_reviewers.length) pr.requested_reviewers.forEach(rr => rr.login && contributorsRaw.push(rr.login));

        });

        // filtering contributors
        const contributors = [...new Set(contributorsRaw)].filter(c => !c.includes("github"));

        const releaseNotesParseResult = ReleaseNotesSchema.safeParse({
            changes,
            contributors
        });

        if (!releaseNotesParseResult.success) {
            const validationError = fromZodError(releaseNotesParseResult.error as ZodError);
            const errorMessage = `Created release notes isn't valid for some reason ${validationError.message}`;
            console.error(errorMessage);
            return error(500, errorMessage);
        }

        const releaseNotes = releaseNotesParseResult.data;

        // storing release notes to DB
        const insertResult = await insertReleaseObject({
            repo,
            head,
            base,
            releaseNotes
        }, env, request);

        if (insertResult.success) {

            //  build outputs and send them to services
            if (request.serviceConfig.notificationServices.includes("slack")) {
                await sendSlackNotification(insertResult.data, request.serviceConfig);
            }

            return new Response(JSON.stringify(insertResult.data), {status: 200});
        } else {
            return new Response("Something went wrong", {status: 500});
        }
    }
}

interface PuTReleaseByIdFromEditParams extends RequestWithConfig {
    params?: {
        id?: string;
        token?: string;
    };
}

export class PutReleaseByIdFromEdit extends OpenAPIRoute<RichRequest> {
    static schema: OpenAPIRouteSchema = {
        responses: {
            "200": {
                description: "Release response",
                schema: ReleaseObjectSchema
            }
        },
        requestBody: ReleaseObjectSchema
    };

    async handle(request: PuTReleaseByIdFromEditParams, env: Env, context: ExecutionContext, data: { body: ReleaseObject }) {
        const id = request.params?.id;
        const token = request.params?.token;

        if (!id) {
            const error = `PutReleaseById: id is undefined`;
            console.error(error);
            return new Response(error, {status: 500});
        }

        const getResult = await getReleaseObjectById(id, env);

        if (getResult.success) {

            if (token === getResult.data.editHash) {

                // storing release to DB
                const insertResult = await updateReleaseObject(data.body, env);

                if (insertResult.success) {
                    // disallowing putting already posted releases
                    if (getResult.data.postedAt) {
                        return new Response("Method Not Allowed", {status: 405});
                    }

                    return new Response(JSON.stringify(insertResult.data), {status: 200});
                } else {
                    return new Response("Something went wrong", {status: 500});
                }

            } else {
                return new Response("Unauthorised", {status: 401});
            }

        } else {
            return new Response(JSON.stringify(getResult.error), {status: 500});
        }
    }
}



