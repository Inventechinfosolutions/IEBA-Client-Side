import type { z } from "zod"

import type {
  POSTED_RECORDS_OUTPUT_TYPES,
  internalReportAccessSchema,
  postedRecordsCountFormSchema,
  postedRecordsCountOptionsSchema,
  postedRecordsCountReportSchema,
  postedRecordsCountySectionSchema,
} from "./schemas"

export type InternalReportAccess = z.infer<typeof internalReportAccessSchema>
export type PostedRecordsCountOptions = z.infer<typeof postedRecordsCountOptionsSchema>
export type PostedRecordsCountySection = z.infer<typeof postedRecordsCountySectionSchema>
export type PostedRecordsCountReport = z.infer<typeof postedRecordsCountReportSchema>
export type PostedRecordsCountFormValues = z.infer<typeof postedRecordsCountFormSchema>
export type PostedRecordsOutputType = (typeof POSTED_RECORDS_OUTPUT_TYPES)[number]

export type PostedRecordsCountRequest = {
  nameSpace: string
  fiscalYearId: string
  startQuarter: number
  endQuarter: number
}

export type PostedRecordsCountRunResult =
  | { kind: "PDF"; blob: Blob; report: PostedRecordsCountReport }
  | { kind: "FILE"; blob: Blob; fileName: string }
