import { z } from "zod"

const payrollFrequencySchema = z.enum(["monthly", "bi_weekly", "semi_monthly", "weekly"])
const payrollPeriodSchema = z.enum(["month", "quarterly"])

export const payrollUploadFormSchema = z.object({
  uploadType: payrollFrequencySchema,
})

export const payrollDetailsFormSchema = z.object({
  payrollType: payrollFrequencySchema,
  fiscalYearId: z.string().min(1, "Fiscal year is required"),
  periodType: payrollPeriodSchema,
  monthOrQuarterId: z.string().min(1, "Selection is required"),
  departmentId: z.string().min(1, "Department is required"),
  employeeIdsSerialized: z.string(),
})
