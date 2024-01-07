import {type z} from "zod";
import {type ReleaseNotesSchema} from "./ReleaseNotesSchema";

export type ReleaseNotes = z.infer<typeof ReleaseNotesSchema>
