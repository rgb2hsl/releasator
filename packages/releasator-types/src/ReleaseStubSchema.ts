import {z} from "zod";
import {RepoStringSchema} from "./RepoStringSchema";
import {RefSchema} from "./RefSchema";

export const ReleaseStubSchema = z.object({
    repo: RepoStringSchema,
    head: RefSchema,
    base: z.optional(RefSchema)
});
