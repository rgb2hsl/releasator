import { z } from 'zod';

import { ReleaseChangeSchema } from './ReleaseChangeSchema';

export const ReleaseNotesSchema = z.object({
    changes: z.array(ReleaseChangeSchema),
    contributors: z.array(z.string())
});
