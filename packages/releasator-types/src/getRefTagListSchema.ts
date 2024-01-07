import {z} from "zod";
import {GhRefTagSchema} from "./GhRefTag";

export const getRefTagListSchema = z.array(GhRefTagSchema);
