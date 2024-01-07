import {z} from "zod";

export const GhRefTagSchema = z.object({
    ref: z.string()
    .min(1),
    node_id: z.string().min(1),
    url: z.string().url().optional(),
    object: z.object({
        sha: z.string().min(1),
        type: z.string().regex(/^(tag|commit)$/).min(1),
        url: z.string().url().min(1)
    })
});

export type GhRefTag = z.infer<typeof GhRefTagSchema>;
