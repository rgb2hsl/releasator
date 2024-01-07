import {z} from "zod";

export const TagNameSchema = z.string().regex(/v\d+\.\d+\.\d+/g);
