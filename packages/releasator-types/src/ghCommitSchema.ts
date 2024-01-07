import {z} from "zod";
import {GhUserWithLoginSchema} from "./ghUserWithLoginSchema";
import {GhCommitComitSchema} from "./ghCommitComitSchema";

export const GhCommitSchema = z.object({
    author: GhUserWithLoginSchema,
    committer: z.object({}),
    commit: GhCommitComitSchema,
    tree: z.object({
        sha: z.string(),
        url: z.string().url()
    }).optional(),
    url: z.string().url(),
    sha: z.string().length(40).regex(/^[0-9a-f]{40}$/i)
});
