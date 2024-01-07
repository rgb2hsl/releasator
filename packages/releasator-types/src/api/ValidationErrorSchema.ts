import {z} from "zod";

export const ValidationErrorSchema = z.object({
    code: z.string().min(1),
    expected: z.string().min(1).optional(),
    received: z.string().min(1).optional(),
    path: z.array(z.union([z.string().min(1), z.number()])),
    message: z.string().optional()
})

export type ValidationError = z.infer<typeof ValidationErrorSchema>
