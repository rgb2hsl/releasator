import {z} from "zod";

export const GhCommitComitSchema = z.object({
    message: z.string(),
    author: z.object({}),
    committer: z.object({
        name: z.string()
    })
});
