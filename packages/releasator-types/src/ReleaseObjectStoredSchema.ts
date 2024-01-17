import {z} from "zod";
import {RepoStringSchema} from "./RepoStringSchema.js";
import {SQLiteDatetime} from "./SQLiteDatetime.js";

export const ReleaseObjectStoredSchema = z.object({
    id: z.string(),
    repo: RepoStringSchema,
    refHeadRaw: z.string().min(1),
    refBaseRaw: z.string().min(1),
    createdAt: SQLiteDatetime,
    queuedTo: SQLiteDatetime,
    postedAt: SQLiteDatetime.nullable(),
    releaseNotesRaw: z.string().min(1),
    editHash: z.string()
});
