import {type z} from "zod";
import {type ReleaseObjectSchema} from "./ReleaseObjectSchema.js";

export type ReleaseObject = z.infer<typeof ReleaseObjectSchema>
