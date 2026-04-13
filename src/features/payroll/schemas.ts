import { z } from "zod"

import { PayrollFrequency } from "./types"

const PAYROLL_FREQUENCY_VALUES = Object.values(PayrollFrequency) as [
  (typeof PayrollFrequency)[keyof typeof PayrollFrequency],
  ...(typeof PayrollFrequency)[keyof typeof PayrollFrequency][],
]
const payrollFrequencySchema = z.enum(PAYROLL_FREQUENCY_VALUES)
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
