import { type z } from 'zod';
import { type RefSchema } from './RefSchema';

export type Ref = z.infer<typeof RefSchema>
