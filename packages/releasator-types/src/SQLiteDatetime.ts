import {z} from "zod";

export const SQLiteDatetime = z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)]);
