import { z } from "zod"

function parseLocalYmd(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  const dt = new Date(y, m - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null
  return dt
}

function diffLocalDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcA - utcB) / 86_400_000)
}

export const REPORT_QUARTERS = ["Qtr-1", "Qtr-2", "Qtr-3", "Qtr-4"] as const

export const reportQuarterSchema = z.enum(REPORT_QUARTERS)

export const REPORT_DOWNLOAD_TYPES = ["PDF", "Excel", "CSV"] as const

export const reportDownloadTypeSchema = z.enum(REPORT_DOWNLOAD_TYPES)

export const reportFormSchema = z
  .object({
    reportKey: z.string().trim().min(1, "Select a report"),
    selectMonthBy: z.enum(["qtr", "dates", "month", "year", "scheduled", "week"]),
    month: z.string().optional(),
    year: z.string().optional(),
    weekId: z.string().optional(),
    fiscalYearId: z.string().optional(),
    quarter: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    departmentId: z.string().optional(),
    masterCode: z.string().optional(),
    /** Comma-separated employee ids (multi-select). */
    employeeIds: z.string().optional(),
    includeActiveEmployees: z.boolean(),
    includeInactiveEmployees: z.boolean(),
    /** Comma-separated activity codes (multi-select); used when report layout includes activities. */
    activityIds: z.string().optional(),
    includeActiveActivities: z.boolean(),
    includeInactiveActivities: z.boolean(),
    /** Comma-separated cost pool ids (multi-select); used when report layout includes cost pools. */
    costPoolIds: z.string().optional(),
    includeActiveCostPools: z.boolean(),
    includeInactiveCostPools: z.boolean(),
    /** Comma-separated program ids (multi-select); used when report layout includes programs. */
    programIds: z.string().optional(),
    includeActivePrograms: z.boolean(),
    includeInactivePrograms: z.boolean(),
    includeUnapprovedTime: z.boolean(),
    /** Selected payroll check date for DSSRPT5. */
    checkDateId: z.string().optional(),
    scheduleTime: z.boolean().optional(),
    timeStudyPeriodId: z.string().optional(),
    retainParameters: z.boolean(),
    downloadType: reportDownloadTypeSchema,
    fileName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.selectMonthBy === "qtr") {
      if (!data.fiscalYearId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a fiscal year",
          path: ["fiscalYearId"],
        })
      }
      const q = data.quarter?.trim() ?? ""
      if (!q || !REPORT_QUARTERS.includes(q as (typeof REPORT_QUARTERS)[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a quarter",
          path: ["quarter"],
        })
      }
    } else if (data.selectMonthBy === "month") {
      if (!data.month?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a month",
          path: ["month"],
        })
      }
    } else if (data.selectMonthBy === "week") {
      if (!data.month?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a month",
          path: ["month"],
        })
      }
      if (!data.dateFrom?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          // message: "Week 1 start date is required",
          message: "Start date is required",
          path: ["dateFrom"],
        })
      }
      if (!data.dateTo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          // message: "Week 1 end date is required",
          message: "End date is required",
          path: ["dateTo"],
        })
      }
      const start = data.dateFrom?.trim() ? parseLocalYmd(data.dateFrom) : null
      const end = data.dateTo?.trim() ? parseLocalYmd(data.dateTo) : null
      const month = data.month?.trim() ?? ""
      if (start && end) {
        if (end < start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Week 1 end date cannot be before start date",
            path: ["dateTo"],
          })
        } else if (diffLocalDays(end, start) > 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Week 1 cannot exceed 7 days",
            path: ["dateTo"],
          })
        }
      }
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        if (data.dateFrom?.trim() && !data.dateFrom.startsWith(month)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Week 1 start date must fall within the selected month",
            path: ["dateFrom"],
          })
        }
        if (data.dateTo?.trim() && !data.dateTo.startsWith(month)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Week 1 end date must fall within the selected month",
            path: ["dateTo"],
          })
        }
      }
    } else if (data.selectMonthBy === "year") {
      if (!data.year?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a year",
          path: ["year"],
        })
      }
    } else {
      if (!data.dateFrom?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required",
          path: ["dateFrom"],
        })
      }
      if (!data.dateTo?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required",
          path: ["dateTo"],
        })
      }
      if (data.dateFrom?.trim() && data.dateTo?.trim() && data.dateFrom > data.dateTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be on or after start date",
          path: ["dateTo"],
        })
      }
    }
  })

export const reportDownloadFileNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a file name")

/** Default form state aligned with {@link reportFormSchema}. */
export const REPORT_FORM_DEFAULT_VALUES: z.infer<typeof reportFormSchema> = {
  reportKey: "",
  selectMonthBy: "month",
  month: "2025-04",
  year: "2025-2026",
  weekId: "",
  fiscalYearId: "2025-2026",
  quarter: "Qtr-4",
  dateFrom: "",
  dateTo: "",
  departmentId: "",
  masterCode: "BOTH",
  employeeIds: "",
  includeActiveEmployees: true,
  includeInactiveEmployees: false,
  activityIds: "",
  includeActiveActivities: true,
  includeInactiveActivities: false,
  costPoolIds: "",
  includeActiveCostPools: true,
  includeInactiveCostPools: false,
  programIds: "",
  includeActivePrograms: true,
  includeInactivePrograms: false,
  includeUnapprovedTime: true,
  checkDateId: "",
  scheduleTime: false,
  timeStudyPeriodId: "",
  retainParameters: false,
  downloadType: "PDF",
  fileName: "",
}
