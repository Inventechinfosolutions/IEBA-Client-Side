import { z } from "zod"

export const jobPoolFormSchema = z.object({
  name: z
    .string()
    .min(1, "Job Pool is required")
    .max(50, "Job Pool must be at most 50 characters"),
  department: z
    .string()
    .min(1, "Department is required")
    .max(100, "Department must be at most 100 characters"),
  active: z.boolean(),
  assignedJobClassificationIds: z.array(z.string()),
  assignedActivityIds: z.array(z.string()),
  assignedEmployeeIds: z.array(z.string()),
});
