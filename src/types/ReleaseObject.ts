import { type z } from 'zod';
import { type ReleaseObjectSchema } from './ReleaseObjectSchema';

export type ReleaseObject = z.infer<typeof ReleaseObjectSchema>
