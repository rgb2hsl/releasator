import {z} from "zod";
import {RepoStringSchema} from "./RepoStringSchema";
import {RefSchema} from "./RefSchema";
import {ReleaseNotesSchema} from "./ReleaseNotesSchema";
import {SQLiteDatetime} from "./SQLiteDatetime";

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
