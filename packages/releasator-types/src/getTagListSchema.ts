import {z} from "zod";
import {GhTagSchema} from "./GhTag";

export const getTagListSchema = z.array(GhTagSchema);
