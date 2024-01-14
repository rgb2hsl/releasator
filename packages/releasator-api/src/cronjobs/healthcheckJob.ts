import type {Env} from "../env";
import {createConfig} from "../middlewares/withConfig";
import {createSlackHealcheckPayload, sendSlackPayload} from "../services/slack";
import {getTagsList} from "../services/github";
import {isValidGitHubRepoString} from "../helpers/isValidGitHubRepoString";
import type {Config} from "../config/ConfigSchema";

export type HealthcheckReport = Array<{
    name: string;
    title: string;
    status: "ok" | "failed";
    error: null | string;
}>;

// TODO more healthcheck jobs: DB, Slack, etc.
export async function healthcheckJob(env: Env) {
    const healtcheck: HealthcheckReport = [];
    let config: Config | undefined;

    const configResult = createConfig(env);

    if (!configResult.success || !configResult.data) {
        console.error('error at cronjob while creating config');

        healtcheck.push({
            name: "config",
            title: "Config",
            status: "failed",
            error: `Error creating config from env: ${configResult.error}`
        })
    } else {

        config = configResult.data;

        // GitHub healthcheck
        let gitHubError = "";
        // token
        if (env.GITHUB_TOKEN) {
            // repository access
            if (config.knownProducts.length) {
                for (const product of config.knownProducts) {
                    if (isValidGitHubRepoString(product.repoString)) {
                        const tagsResponse = await getTagsList(product.repoString, env);
                        if (tagsResponse.status !== 200) {
                            gitHubError = `${gitHubError}getTagsList responded with status ${tagsResponse.status} for getTagsList for repo ${product.repoString}. `;
                        }
                    }
                }
            }
        } else {
            gitHubError = "No GitHub token provided";
        }
        if (gitHubError) {
            healtcheck.push({
                name: "github",
                title: "GitHub",
                status: "failed",
                error: gitHubError
            })
        } else {
            healtcheck.push({
                name: "github",
                title: "GitHub",
                status: "ok",
                error: null
            })
        }
    }

    const isPassed = healtcheck.find(he => he.status === "failed") === undefined;

    if (isPassed) {
        console.info('Healthcheck passed');
    } else {
        console.error('Healthcheck FAILED');

        if (config && config.notificationServices?.includes("slack") && config.slackService) {
            const payload = createSlackHealcheckPayload(healtcheck, isPassed);
            await sendSlackPayload(payload, config, true);
        }
    }
}
