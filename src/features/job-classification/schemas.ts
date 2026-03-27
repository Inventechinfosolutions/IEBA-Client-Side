import { z } from "zod"

export const jobClassificationFormSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(20, "Code must be at most 20 characters"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  activityDescription: z.string().optional(),
  active: z.boolean(),
})
