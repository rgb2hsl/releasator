import {isValidGitHubRepoString} from "../helpers/isValidGitHubRepoString";
import {type Env} from "../env";
import {
    getRefTagListSchema,
    getTagListSchema,
    type GhCommitPullRequests,
    GhCommitPullRequestsSchema,
    type GhCompare,
    GhCompareSchema,
    type GhRefTag,
    GhRefTagSchema,
    type GhTag
} from "releasator-types";

export async function getTagsList(repoString: string, env: Env): Promise<{
    data: GhTag[] | undefined;
    status: number;
}> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/tags?per_page=100`;

        console.info(`getTagsList Calling GitHub API ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "User-Agent": "changeloguevara/1.0"
            }
        });

        if (response.status === 200) {
            let result: GhTag[] | undefined;

            try {
                result = getTagListSchema.parse(await response.json<GhTag[]>());
            } catch (e) {
                console.error("getTagsList error", e);
            }

            if (result) {
                return {
                    data: result,
                    status: 200
                }
            } else {
                return {
                    data: undefined,
                    status: 500
                }
            }
        } else {
            return {
                data: undefined,
                status: response.status
            }
        }
    }

    return {
        data: undefined,
        status: 500
    }
}

export async function getRefTagList(repoString: string, env: Env): Promise<GhRefTag[] | undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/git/refs/tags`;

        console.info(`getRefTagList alling GitHub API ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "User-Agent": "changeloguevara/1.0"
            }
        });

        let result: GhRefTag[] | undefined;

        try {
            result = getRefTagListSchema.parse(await response.json<GhRefTag[]>());
        } catch (e) {
            console.error("getRefTagList error", e);
        }

        if (result) return result;
    }
}

export async function getRefTag(tagName: string, repoString: string, env: Env): Promise<GhRefTag | undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/git/refs/tags/${tagName}`;

        console.info(`getRefTag Calling GitHub API ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "User-Agent": "changeloguevara/1.0"
            }
        });

        let result: GhRefTag | undefined;

        try {
            result = GhRefTagSchema.parse(await response.json<GhRefTag>());
        } catch (e) {
            console.error("getRefTag error", e);
        }

        if (result) return result;
    }
}

export async function getCompare(baseSha: string, headSha: string, repoString: string, env: Env): Promise<GhCompare | undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/compare/${baseSha}...${headSha}`;

        console.info(`getCompare Calling GitHub API ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "User-Agent": "changeloguevara/1.0"
            }
        });

        let result: GhCompare | undefined;

        try {
            result = GhCompareSchema.parse(await response.json<GhCompare>());
        } catch (e) {
            console.error("getCompare error", e);
        }

        if (result) return result;
    }
}

export async function getCommitPRs(commitSha: string, repoString: string, env: Env): Promise<GhCommitPullRequests | undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/commits/${commitSha}/pulls`;

        console.info(`getCommitPRs Calling GitHub API ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "User-Agent": "changeloguevara/1.0"
            }
        });

        let result: GhCommitPullRequests | undefined;

        try {
            result = GhCommitPullRequestsSchema.parse(await response.json<GhCommitPullRequests>());
        } catch (e) {
            console.error("getCommitPRs error", e);
        }

        if (result) return result;
    }
}
