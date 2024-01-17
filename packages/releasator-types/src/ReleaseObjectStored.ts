import {type z} from "zod";
import {type ReleaseObjectStoredSchema} from "./ReleaseObjectStoredSchema.js";

export type ReleaseObjectStored = z.infer<typeof ReleaseObjectStoredSchema>
