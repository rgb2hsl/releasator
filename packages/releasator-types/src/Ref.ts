import {type z} from "zod";
import {type RefSchema} from "./RefSchema.js";

export type Ref = z.infer<typeof RefSchema>
