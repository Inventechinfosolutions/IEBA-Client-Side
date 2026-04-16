import { z } from "zod"

export const dashboardFilterSchema = z.object({
  payrollType: z.string().min(1, "Payroll type is required"),
  userId: z.union([z.string(), z.number()]).optional(),
})

export type DashboardFilterValues = z.infer<typeof dashboardFilterSchema>
