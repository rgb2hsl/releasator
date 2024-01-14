import {type Config} from "../config/ConfigSchema";
import {type ReleaseObject} from "releasator-types";
import {type KnownBlock} from "@slack/types";

export function createSlackPayload(release: ReleaseObject, config: Config) {
    const product = config.knownProducts.find(p => p.repoString === release.repo);
    // TODO product website url insertion
    const prepTitle = `*${product ? product.name : release.repo}* ${release.head.name} released 🚀`;

    const changesBlocks: KnownBlock[] = [];

    release.releaseNotes.changes.forEach(change => {

        // titile
        change.title && changesBlocks.push({
            type: "header",
            text: {
                type: "plain_text",
                text: change.title
            }
        });

        // body
        change.body && changesBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: change.body
            }
        });

        // details and demos
        let demos;
        // demoUrls can be empty
        if (change.demoUrls.length > 2) {
            demos = `Check it out: ${change.demoUrls.slice(0, -2).map((url, i) => `<${url}|${i2w(i)}>`).join(", ")}, <${change.demoUrls[change.demoUrls.length - 2]}|${i2w(change.demoUrls.length - 2)}> and <${change.demoUrls[change.demoUrls.length - 1]}|${i2w(change.demoUrls.length - 1)}>`;
        } else if (change.demoUrls.length === 2) {
            demos = `Check it out <${change.demoUrls[0]}|here> and <${change.demoUrls[1]}|here>`;
        } else if (change.demoUrls.length === 1) {
            demos = `Check it out <${change.demoUrls[0]}|here>`;
        } else {
            demos = "";
        }

        let details;

        // prUrl is always present
        details = `See <${change.prUrl}|PR ${change.prNumber}> for detailed notes`;

        // jiraUrls can be empty
        if (change.jiraUrls.length === 0) {
            details = `${details}.`;
        } else if (change.jiraUrls.length === 1) {
            details = `${details} and <${change.jiraUrls[0].url}|${change.jiraUrls[0].issueId}>`;
        } else if (change.jiraUrls.length === 2) {
            details = `${details}, issues <${change.jiraUrls[0].url}|${change.jiraUrls[0].issueId}> and <${change.jiraUrls[1].url}|${change.jiraUrls[1].issueId}>`;
        } else {
            details = `${details}, issues ${change.jiraUrls.map(ji => `<${ji.url}|${ji.issueId}>`).join(", ")}.`;
        }

        demos && changesBlocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: demos
                }
            ]
        });

        details && changesBlocks.push({
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: details
                }
            ]
        });

    });

    const contributors = release.releaseNotes.contributors.map(c => {
        const knownContributor = config.knownContributors.find(kc => kc.githubLogin === c);

        if (knownContributor?.slackUID) {
            return `<@${knownContributor.slackUID}>`;
        } else {
            return c;
        }
    });

    const payload: { blocks: KnownBlock[] } = {
        blocks: [
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: prepTitle
                }
            },
            {
                type: "context",
                elements: [
                    {
                        type: "mrkdwn",
                        text: `Changes from version ${release.base.name}:`
                    }
                ]
            },

            ...changesBlocks,

            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: " "
                }
            },
            {
                type: "context",
                elements: [
                    {
                        "type": "mrkdwn",
                        "text": `👏 to contributors: ${contributors.join(", ")}`
                    }
                ]
            }
        ]
    };

    return payload;
}

export async function sendSlackNotification(release: ReleaseObject, config: Config, production?: boolean) {
    const service = production !== true;

    if (!config.slackService) {
        return {error: "Slack service isn't configured"};
    }

    const payload = createSlackPayload(release, config);

    if (service) {
        payload.blocks.push({
            "type": "divider"
        });

        payload.blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: `This will be posted at ${release.queuedTo} UTC. <${config.guiRoot}/release/${release.id}/edit/${release.editHash}|Edit it>.`
            }
        });
    }

    const chunks = [];
    for (let i = 0; i < payload.blocks.length; i += 50) {
        chunks.push({
            blocks: payload.blocks.slice(i, i + 50)
        });
    }

    const results = [];

    for (const chunk of chunks) {
        try {

            const response = await fetch(service ? config.slackService.adminChannelWebhook : config.slackService.notificationsChannelWebhook, {
                method: "POST", // Specify the method
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "releasator-api/1.0"
                },
                body: JSON.stringify(chunk) // Convert the JavaScript object to a JSON string
            });

            if (response.status === 200) {
                console.info(`sendAdminSlackNotification: message successfully delivered`);
                results.push({chunk, success: true});
            } else if (response.status > 200) {
                const text = await response.text();
                const error = `sendAdminSlackNotification fetched response status ${response.status}: ${text}`;
                console.error(error);
                results.push({chunk, success: false, error});
            }
        } catch (e) {
            const error = `sendAdminSlackNotification: error fetching, ${JSON.stringify(e)}`;
            console.error(error);
            results.push({chunk, success: false, error});
        }
    }

    const failed = results.filter(r => !r.success);
    if (failed.length) console.error(`createSlackPayload: sending ${failed.length} chunks failed with errors: ${failed.map(f => f.error).join(", ")}`);

    const successfull = results.filter(r => r.success);
    if (successfull.length) console.info(`createSlackPayload: sending ${successfull.length} chunks successfull`);

    return {
        failed,
        successfull
    }
}

function i2w(n: number) {
    if (n === 0) return "one";
    if (n === 1) return "two";
    if (n === 2) return "three";
    if (n === 3) return "four";
    if (n === 4) return "five";
    if (n === 5) return "six";
    if (n === 6) return "seven";
    if (n === 7) return "eight";
    if (n === 8) return "nine";
    if (n === 9) return "ten";
    return `${n+1}`;
}
