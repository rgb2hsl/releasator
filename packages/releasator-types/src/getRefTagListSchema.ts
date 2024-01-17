import {z} from "zod";
import {GhRefTagSchema} from "./GhRefTag.js";

export const getRefTagListSchema = z.array(GhRefTagSchema);
