import {z} from "zod";
import {GhCommitComitSchema} from "./ghCommitComitSchema";
import {GhCommitSchema} from "./ghCommitSchema";

export const GhCompareSchema = z.object({
    url: z.string().url(),
    html_url: z.string().url(),
    permalink_url: z.string().url(),
    diff_url: z.string().url(),
    base_commit: z.object({
        sha: z.string(),
        commit: GhCommitComitSchema
    }),
    merge_base_commit: z.object({
        sha: z.string(),
        commit: GhCommitComitSchema
    }),
    status: z.string(),
    ahead_by: z.number(),
    behind_by: z.number(),
    total_commits: z.number(),
    commits: z.array(GhCommitSchema)
});

export type GhCompare = z.infer<typeof GhCompareSchema>;
