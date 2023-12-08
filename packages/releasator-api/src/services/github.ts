import { isValidGitHubRepoString } from '../helpers/isValidGitHubRepoString';
import { type Env } from '../env';
import { z } from 'zod';
import { type GhTag, GhTagSchema } from '../types/github/api/GhTag';
import { type GhRefTag, GhRefTagSchema } from '../types/github/api/GhRefTag';

const getTagListSchema = z.array(GhTagSchema);

export async function getTagsList(repoString: string, env: Env): Promise<GhTag[]|undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/tags?per_page=100`;

        console.info(`getTagsList Calling GitHub API ${url}`);

        const response=  await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'changeloguevara/1.0'
            },
        });

        let result: GhTag[] | undefined;

        try {
            result = getTagListSchema.parse(await response.json<GhTag[]>())
        } catch (e) {
            console.error('getTagsList error', e);
        }

        if (result) return  result;
    }
}


const getRefTagListSchema = z.array(GhRefTagSchema);
export async function getRefTagList(repoString: string, env: Env): Promise<GhRefTag[]|undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/git/refs/tags`;

        console.info(`getRefTagList alling GitHub API ${url}`);

        const response=  await fetch(url, {
           method: 'GET',
           headers: {
               'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
               'User-Agent': 'changeloguevara/1.0'
           },
        });

        let result: GhRefTag[] | undefined;

        try {
            result = getRefTagListSchema.parse(await response.json<GhRefTag[]>())
        } catch (e) {
            console.error('getRefTagList error', e);
        }

        if (result) return  result;
    }
}

export async function getRefTag(tagName: string, repoString: string, env: Env): Promise<GhRefTag|undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/git/refs/tags/${tagName}`;

        console.info(`getRefTag Calling GitHub API ${url}`);

        const response=  await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'changeloguevara/1.0'
            },
        });

        let result: GhRefTag | undefined;

        try {
            result = GhRefTagSchema.parse(await response.json<GhRefTag>())
        } catch (e) {
            console.error('getRefTag error', e);
        }

        if (result) return  result;
    }
}

const GhCommitComitSchema = z.object({
    message: z.string(),
    author: z.object({}),
    committer: z.object({
        name: z.string()
    })
});

const GhUserWithLoginSchema = z.object({
    login: z.string(),
    avatar_url: z.string().url(),
    html_url: z.string().url(),
    type: z.union([z.string().optional(),z.literal('User')])
});

const GhCommitSchema = z.object({
    author: GhUserWithLoginSchema,
    committer: z.object({}),
    commit: GhCommitComitSchema,
    tree: z.object({
        sha: z.string(),
        url: z.string().url()
    }).optional(),
    url: z.string().url(),
    sha: z.string().length(40).regex(/^[0-9a-f]{40}$/i),
});

const GhCompareSchema = z.object({
    url: z.string().url(),
    html_url: z.string().url(),
    permalink_url: z.string().url(),
    diff_url: z.string().url(),
    base_commit: z.object({
        sha: z.string(),
        commit: GhCommitComitSchema,
    }),
    merge_base_commit: z.object({
        sha: z.string(),
        commit: GhCommitComitSchema,
    }),
    status: z.string(),
    ahead_by: z.number(),
    behind_by: z.number(),
    total_commits: z.number(),
    commits: z.array(GhCommitSchema),
});

type GhCompare = z.infer<typeof GhCompareSchema>;

export async function getCompare(baseSha: string, headSha: string, repoString: string, env: Env): Promise<GhCompare|undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/compare/${baseSha}...${headSha}`;

        console.info(`getCompare Calling GitHub API ${url}`);

        const response=  await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'changeloguevara/1.0'
            },
        });

        let result: GhCompare | undefined;

        try {
            result = GhCompareSchema.parse(await response.json<GhCompare>())
        } catch (e) {
            console.error('getCompare error', e);
        }

        if (result) return result;
    }
}

export const GhPullRequestSchema = z.object({
    url: z.string().url(),
    id: z.number(),
    node_id: z.string(),
    html_url: z.string().url(),
    diff_url: z.string().url(),
    patch_url: z.string().url(),
    issue_url: z.string().url(),
    number: z.number(),
    state: z.union([z.literal("open"),z.literal("closed")]),
    locked: z.boolean(),
    title: z.string(),
    user: GhUserWithLoginSchema,
    body: z.string().nullable().optional(),
    created_at: z.string(),
    updated_at: z.string(),
    closed_at: z.string().nullable(),
    merged_at: z.string().nullable(),
    merge_commit_sha: z.string(),
    assignee: z.nullable(GhUserWithLoginSchema).nullable().optional(),
    assignees: z.array(GhUserWithLoginSchema).nullable().optional(),
    requested_reviewers: z.array(GhUserWithLoginSchema),
    requested_teams: z.array(z.any()),
    labels: z.array(z.any()),
    milestone: z.any().nullable(),
    draft: z.boolean(),
    commits_url: z.string().url(),
    review_comments_url: z.string().url(),
    review_comment_url: z.string().url(),
    comments_url: z.string().url(),
    statuses_url: z.string().url(),
    head: z.object({}),
    base: z.object({}),
    _links: z.object({}),
    author_association: z.string(),
    auto_merge: z.any().nullable(),
    active_lock_reason: z.string().nullable()
});

export type GhPullRequest = z.infer<typeof GhPullRequestSchema>

const GhCommitPullRequestsSchema = z.array(GhPullRequestSchema);

export type GhCommitPullRequests = z.infer<typeof GhCommitPullRequestsSchema>;

export async function getCommitPRs(commitSha: string, repoString: string, env: Env): Promise<GhCommitPullRequests|undefined> {
    if (isValidGitHubRepoString(repoString)) {
        const url = `https://api.github.com/repos/${repoString}/commits/${commitSha}/pulls`;

        console.info(`getCommitPRs Calling GitHub API ${url}`);

        const response=  await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
                'User-Agent': 'changeloguevara/1.0'
            },
        });

        let result: GhCommitPullRequests | undefined;

        try {
            result = GhCommitPullRequestsSchema.parse(await response.json<GhCommitPullRequests>())
        } catch (e) {
            console.error('getCommitPRs error', e);
        }

        if (result) return result;
    }
}
