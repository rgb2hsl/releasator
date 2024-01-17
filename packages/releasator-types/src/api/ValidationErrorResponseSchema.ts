import {z} from "zod";
import {ValidationErrorSchema} from "./ValidationErrorSchema.js";

export const ValidationErrorResponseSchema = z.object({
    errors: z.array(ValidationErrorSchema),
    success: z.boolean().optional(),
    result: z.object({}).optional()
})

export type ValidationErrorResponse = z.infer<typeof ValidationErrorResponseSchema>
