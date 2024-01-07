import {z} from "zod";

export const ConfigSchema = z.object({
    API_ROOT: z.string().url()
});

export type Config = z.infer<typeof ConfigSchema>;
