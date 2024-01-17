import {z} from "zod";

import {ReleaseChangeSchema} from "./ReleaseChangeSchema.js";

export const ReleaseNotesSchema = z.object({
    changes: z.array(ReleaseChangeSchema),
    contributors: z.array(z.string().min(1))
});
