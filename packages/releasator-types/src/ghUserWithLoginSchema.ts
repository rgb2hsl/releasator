import {z} from "zod";

export const GhUserWithLoginSchema = z.object({
    login: z.string(),
    avatar_url: z.string().url(),
    html_url: z.string().url(),
    type: z.union([z.string().optional(), z.literal("User")])
});
