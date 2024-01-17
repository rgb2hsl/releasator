import {z} from "zod";
import {RepoStringSchema} from "./RepoStringSchema.js";
import {RefSchema} from "./RefSchema.js";
import {ReleaseNotesSchema} from "./ReleaseNotesSchema.js";
import {SQLiteDatetime} from "./SQLiteDatetime.js";

export const ReleaseObjectSchema = z.object({
    id: z.string(),
    repo: RepoStringSchema,
    head: RefSchema,
    base: RefSchema,
    createdAt: SQLiteDatetime,
    queuedTo: SQLiteDatetime,
    postedAt: SQLiteDatetime.nullable(),
    releaseNotes: ReleaseNotesSchema,
    editHash: z.string()
});
