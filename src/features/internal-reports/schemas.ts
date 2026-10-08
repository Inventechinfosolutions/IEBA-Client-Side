import { z } from "zod"

export const POSTED_RECORDS_ALL_COUNTIES = "ALL"

export const POSTED_RECORDS_OUTPUT_TYPES = ["PDF", "EXCEL", "CSV"] as const

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    data,
  })

export const internalReportAccessSchema = z.object({
  allowed: z.boolean(),
})

export const postedRecordsCountOptionsSchema = z.object({
  counties: z.array(z.object({ nameSpace: z.string(), countyName: z.string() })),
  fiscalYears: z.array(z.object({ id: z.string(), start: z.string(), end: z.string() })),
  currentNameSpace: z.string(),
})

const countsSchema = z.array(z.number())

export const postedRecordsCountySectionSchema = z.object({
  nameSpace: z.string(),
  countyName: z.string(),
  status: z.enum(["ok", "error"]),
  error: z.string().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
  quarters: z.array(z.number()),
  departmentNames: z.array(z.string()).default([]),
  departments: z.array(
    z.object({
      departmentId: z.number(),
      departmentName: z.string(),
      /** Users active at any point in each month (aligned with report `monthLabels`). */
      monthCounts: countsSchema,
      /** Unique users active at any point in each quarter. */
      counts: countsSchema,
    }),
  ),
  countyMonthTotals: countsSchema,
  countyTotals: countsSchema,
})

export const postedRecordsCountReportSchema = z.object({
  reportCode: z.string(),
  reportTitle: z.string(),
  fiscalYearId: z.string(),
  startQuarter: z.number(),
  endQuarter: z.number(),
  quarterLabels: z.array(z.string()),
  monthLabels: z.array(z.string()),
  monthQuarters: z.array(z.number()),
  allCounties: z.boolean(),
  counties: z.array(postedRecordsCountySectionSchema),
  grandMonthTotals: countsSchema,
  grandTotals: countsSchema,
  generatedAt: z.string(),
})

export const POSTED_RECORDS_QUARTERS = ["1", "2", "3", "4"] as const

export const postedRecordsCountFormSchema = z
  .object({
    nameSpace: z.string().min(1, "Select a county"),
    fiscalYearId: z.string().regex(/^\d{4}-\d{4}$/, "Select a fiscal year"),
    startQuarter: z.enum(POSTED_RECORDS_QUARTERS, { message: "Select a quarter" }),
    endQuarter: z.enum(POSTED_RECORDS_QUARTERS, { message: "Select a quarter" }),
    outputType: z.enum(POSTED_RECORDS_OUTPUT_TYPES),
  })
  .refine((v) => Number(v.startQuarter) <= Number(v.endQuarter), {
    message: "Ending quarter must be on or after the beginning quarter",
    path: ["endQuarter"],
  })
