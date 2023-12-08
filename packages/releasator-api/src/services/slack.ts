import { type Config } from '../config/ConfigSchema';
import { type ReleaseObject } from '../types/ReleaseObject';
import { type KnownBlock } from '@slack/types';

export function createSlackPayload (release: ReleaseObject, config: Config) {
    const product = config.knownProducts.find(p => p.repoString === release.repo);
    const prepTitle = `*${product ? product.name : release.repo}* ${release.head.name} released 🚀`

    const changesBlocks: KnownBlock[] = [];

    release.releaseNotes.changes.forEach(change => {

        // titile
        changesBlocks.push({
            type: "header",
            text: {
                type: "plain_text",
                text: change.title
            }
        });

        // body
        changesBlocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: change.body
            }
        });

        // details

        let details;

        // demoUrls can be empty
        if (change.demoUrls.length > 2) {
            details = `Check it out ${change.demoUrls.slice(0, -2).map(url => `<${url}|here>`).join(", ")}<${change.demoUrls[change.demoUrls.length-2]}|here> and <${change.demoUrls[change.demoUrls.length-1]}|here>`;
        } else if (change.demoUrls.length === 2) {
            details = `Check it out <${change.demoUrls[0]}|here> and <${change.demoUrls[1]}|here>`;
        } else if (change.demoUrls.length === 1) {
            details = `Check it out <${change.demoUrls[0]}|here>`;
        } else {
            details = '';
        }

        // prUrl is always present
        if (details) {
            details = `${details}. Also see <${change.prUrl}|PR ${change.prNumber}> for detailed notes`
        } else {
            details = `See <${change.prUrl}|PR ${change.prNumber}> for detailed notes`
        }

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

        changesBlocks.push({
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
            return `<@${knownContributor.slackUID}>`
        } else {
            return c
        }
    })

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

export async function sendAdminSlackNotification(release: ReleaseObject, config: Config) {
    if (!config.slackService) {
        return { error: "Slack service isn't configured" };
    }

    const payload = createSlackPayload(release, config);

    try {
        const response = await fetch(config.slackService?.adminChannelWebhook, {
            method: 'POST', // Specify the method
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'changeloguevara/1.0',
            },
            body: JSON.stringify(payload) // Convert the JavaScript object to a JSON string
        });

        if (response.status === 200) {
            console.info(`sendAdminSlackNotification: message successfully delivered`);
            return { success: "success" };
        } else if (response.status > 200) {
            const text = await response.text();
            const error = `sendAdminSlackNotification fetched response status ${response.status}: ${text}`;
            return { error };
        }

        console.log("---");
        console.log(JSON.stringify({ text: payload }));
        console.log("---");

    } catch (e) {
        const error = `sendAdminSlackNotification: error fetching, ${JSON.stringify(e)}`;
        console.info(error);
        return { error };
    }
}
