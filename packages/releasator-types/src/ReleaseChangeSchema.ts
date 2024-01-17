import {z} from "zod";

import {GhPullRequestSchema} from "./ghPullRequestSchema.js";

export const ReleaseChangeSchema = z.object({
    pr: z.optional(GhPullRequestSchema),
    title: z.string().min(1),
    body: z.string(),
    demoUrls: z.array(z.string().url().min(1)),
    jiraUrls: z.array(z.object({
        url: z.string(),
        issueId: z.string()
    })),
    prUrl: z.string(),
    prNumber: z.number()
});
