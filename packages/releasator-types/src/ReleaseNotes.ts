import {type z} from "zod";
import {type ReleaseNotesSchema} from "./ReleaseNotesSchema.js";

export type ReleaseNotes = z.infer<typeof ReleaseNotesSchema>
