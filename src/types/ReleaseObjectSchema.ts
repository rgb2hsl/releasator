import { z } from 'zod';
import { RepoStringSchema } from './RepoStringSchema';
import { RefSchema } from './RefSchema';
import { ReleaseNotesSchema } from './ReleaseNotesSchema';

export const ReleaseObjectSchema = z.object({
    id: z.string(),
    repo: RepoStringSchema,
    head: RefSchema,
    base: RefSchema,
    createdAt: z.string().datetime(),
    queuedTo: z.string().datetime(),
    releaseNotes: ReleaseNotesSchema,
});
