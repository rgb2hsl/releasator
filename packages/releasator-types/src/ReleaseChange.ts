import {type z} from "zod";
import {type ReleaseChangeSchema} from "./ReleaseChangeSchema";

export type ReleaseChange = z.infer<typeof ReleaseChangeSchema>
