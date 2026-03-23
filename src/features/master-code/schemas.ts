import { z } from "zod"

export const masterCodeFormSchema = z.object({
  code: z.string().trim().min(1, "Code is required"),
  name: z.string().trim().min(1, "Name is required"),
  ffpPercent: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Use a valid percent format")
    .optional()
    .or(z.literal("")),
  match: z.enum(["E", "N"]).optional().or(z.literal("")),
  spmp: z.boolean(),
  allocable: z.boolean(),
  active: z.boolean(),
  activityDescription: z.string().refine(
    (value) => value.replace(/<[^>]*>/g, "").trim().length > 0,
    { message: "Activity description is required" }
  ),
})
