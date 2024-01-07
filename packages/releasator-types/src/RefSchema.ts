import {z} from "zod";
import {TagNameSchema} from "./TagNameSchema";

export const RefSchema = z.object({
    type: z.union([z.literal("tag"), z.literal("commit")]),
    name: TagNameSchema // TODO to handle commits it needs to be changed
});
