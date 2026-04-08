import { z } from "zod"

function parseTimeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (
    Number.isNaN(h) ||
    Number.isNaN(min) ||
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59
  ) {
    return null
  }
  return h * 60 + min
}

const EMPTY = "__empty__"

export const employeeLeaveRequestRowSchema = z
  .object({
    date: z.string().trim().min(1, "Date is required"),
    startTime: z.string().trim().min(1, "Start time is required"),
    endTime: z.string().trim().min(1, "End time is required"),
    programCode: z
      .string()
      .trim()
      .refine((v) => v.length > 0 && v !== EMPTY, "Program code is required"),
    activityCode: z
      .string()
      .trim()
      .refine((v) => v.length > 0 && v !== EMPTY, "Activity code is required"),
    totalMinApplied: z
      .string()
      .trim()
      .min(1, "Total minutes is required")
      .refine((v) => /^\d+$/.test(v), "Enter whole minutes")
      .refine((v) => parseInt(v, 10) >= 0, "Minutes cannot be negative"),
    comment: z.string().trim(),
  })
  .superRefine((row, ctx) => {
    const startM = parseTimeToMinutes(row.startTime)
    const endM = parseTimeToMinutes(row.endTime)
    if (startM === null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid start time (HH:MM)",
        path: ["startTime"],
      })
    }
    if (endM === null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid end time (HH:MM)",
        path: ["endTime"],
      })
    }
    if (
      startM !== null &&
      endM !== null &&
      endM <= startM
    ) {
      ctx.addIssue({
        code: "custom",
        message: "End time must be after start time",
        path: ["endTime"],
      })
    }
  })

export const employeeLeaveRequestFormSchema = z.object({
  entries: z
    .array(employeeLeaveRequestRowSchema)
    .min(1, "Add at least one leave entry"),
})

export type EmployeeLeaveRequestFormValues = z.infer<
  typeof employeeLeaveRequestFormSchema
>

export type EmployeeLeaveRequestRowValues = z.infer<
  typeof employeeLeaveRequestRowSchema
>

export { EMPTY as EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE }
