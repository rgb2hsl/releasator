import {z} from "zod";
import {GhUserWithLoginSchema} from "./ghUserWithLoginSchema.js";

export const GhPullRequestSchema = z.object({
    url: z.string().url(),
    id: z.number(),
    node_id: z.string(),
    html_url: z.string().url(),
    diff_url: z.string().url(),
    patch_url: z.string().url(),
    issue_url: z.string().url(),
    number: z.number(),
    state: z.union([z.literal("open"), z.literal("closed")]),
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
export const GhCommitPullRequestsSchema = z.array(GhPullRequestSchema);

export type GhCommitPullRequests = z.infer<typeof GhCommitPullRequestsSchema>;
