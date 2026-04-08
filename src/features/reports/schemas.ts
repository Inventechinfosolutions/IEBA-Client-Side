import { z } from "zod"

export const REPORT_QUARTERS = ["Qtr-1", "Qtr-2", "Qtr-3", "Qtr-4"] as const

export const reportQuarterSchema = z.enum(REPORT_QUARTERS)

export const REPORT_DOWNLOAD_TYPES = ["PDF", "Excel", "CSV"] as const

export const reportDownloadTypeSchema = z.enum(REPORT_DOWNLOAD_TYPES)

export const reportFormSchema = z
  .object({
    reportKey: z.string().trim().min(1, "Select a report"),
    selectMonthBy: z.enum(["qtr", "dates"]),
    fiscalYearId: z.string().optional(),
    quarter: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    departmentId: z.string().optional(),
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
    includeUnapprovedTime: z.boolean(),
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
  selectMonthBy: "qtr",
  fiscalYearId: "2025-2026",
  quarter: "Qtr-4",
  dateFrom: "",
  dateTo: "",
  departmentId: "",
  employeeIds: "",
  includeActiveEmployees: true,
  includeInactiveEmployees: false,
  activityIds: "",
  includeActiveActivities: true,
  includeInactiveActivities: false,
  costPoolIds: "",
  includeActiveCostPools: true,
  includeInactiveCostPools: false,
  includeUnapprovedTime: true,
  retainParameters: false,
  downloadType: "PDF",
  fileName: "",
}
