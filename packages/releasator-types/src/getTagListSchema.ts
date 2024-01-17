import {z} from "zod";
import {GhTagSchema} from "./GhTag.js";

export const getTagListSchema = z.array(GhTagSchema);
