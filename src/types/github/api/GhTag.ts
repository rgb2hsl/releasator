import { z } from 'zod';
export const GhTagSchema = z.object({
    name: z.string()
        .min(1, 'Tag name is required'),
    zipball_url: z.string().url('Must be a valid URL').min(1, 'Tag zipball URL is required'),
    tarball_url: z.string().url('Must be a valid URL').min(1, 'Tag tarball URL is required'),
    commit: z.object({
        sha: z.string()
            .regex(/^[0-9a-f]{40}$/i, 'Tag commit must be a valid SHA1')
            .min(1, 'Tag commit SHA is required'),
        url: z.string().url('Must be a valid URL').min(1, 'Tag commit URL is required')
    }),
    node_id: z.string().min(1, 'Node ID is required')
});

export type GhTag = z.infer<typeof GhTagSchema>;
