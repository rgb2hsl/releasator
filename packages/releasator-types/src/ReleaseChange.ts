import {type z} from "zod";
import {type ReleaseChangeSchema} from "./ReleaseChangeSchema.js";

export type ReleaseChange = z.infer<typeof ReleaseChangeSchema>
