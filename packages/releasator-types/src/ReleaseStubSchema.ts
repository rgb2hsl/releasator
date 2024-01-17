import {z} from "zod";
import {RepoStringSchema} from "./RepoStringSchema.js";
import {RefSchema} from "./RefSchema.js";

export const ReleaseStubSchema = z.object({
    repo: RepoStringSchema,
    head: RefSchema,
    base: z.optional(RefSchema)
});
