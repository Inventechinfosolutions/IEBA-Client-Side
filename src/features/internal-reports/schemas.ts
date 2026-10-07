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

const quarterCountsSchema = z.array(z.number())

const quarterTotalsSchema = z.object({ counts: quarterCountsSchema, total: z.number() })

const emptyQuarterTotals = { counts: [], total: 0 }

export const postedRecordsCountySectionSchema = z.object({
  nameSpace: z.string(),
  countyName: z.string(),
  status: z.enum(["ok", "error"]),
  error: z.string().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
  quarters: z.array(z.number()),
  departmentNames: z.array(z.string()).default([]),
  activeUsers: z.number(),
  employeeRecords: quarterTotalsSchema,
  timeStudyRecords: z.object({
    fullTime: quarterTotalsSchema.default(emptyQuarterTotals),
    monthly: quarterTotalsSchema.default(emptyQuarterTotals),
    departments: z.array(
      z.object({
        departmentId: z.number(),
        departmentName: z.string(),
        counts: quarterCountsSchema,
        total: z.number(),
      }),
    ),
    counts: quarterCountsSchema,
    total: z.number(),
  }),
})

export const postedRecordsCountReportSchema = z.object({
  reportCode: z.string(),
  reportTitle: z.string(),
  fiscalYearId: z.string(),
  startQuarter: z.number(),
  endQuarter: z.number(),
  quarterLabels: z.array(z.string()),
  allCounties: z.boolean(),
  counties: z.array(postedRecordsCountySectionSchema),
  summary: z.object({
    activeUsers: z.number(),
    employees: z.number(),
    timeStudyRecords: z.number(),
    timeStudyRecordCounts: quarterCountsSchema,
  }),
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
