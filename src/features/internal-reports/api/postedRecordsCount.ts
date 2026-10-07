import { api } from "@/lib/api"

import {
  apiEnvelopeSchema,
  internalReportAccessSchema,
  postedRecordsCountOptionsSchema,
  postedRecordsCountReportSchema,
} from "../schemas"
import type {
  InternalReportAccess,
  PostedRecordsCountOptions,
  PostedRecordsCountReport,
  PostedRecordsCountRequest,
} from "../types"

const FILE_MIME: Record<"EXCEL" | "CSV", string> = {
  EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  CSV: "text/csv;charset=utf-8",
}

export async function fetchInternalReportAccess(): Promise<InternalReportAccess> {
  const raw = await api.get<unknown>("/report/internal/access")
  return apiEnvelopeSchema(internalReportAccessSchema).parse(raw).data
}

export async function fetchPostedRecordsCountOptions(): Promise<PostedRecordsCountOptions> {
  const raw = await api.get<unknown>("/report/internal/posted-records-count/options")
  return apiEnvelopeSchema(postedRecordsCountOptionsSchema).parse(raw).data
}

export async function fetchPostedRecordsCountReport(
  body: PostedRecordsCountRequest,
  signal?: AbortSignal,
): Promise<PostedRecordsCountReport> {
  const raw = await api.post<unknown>("/report/internal/posted-records-count", { ...body, downloadType: "JSON" }, { signal })
  return apiEnvelopeSchema(postedRecordsCountReportSchema).parse(raw).data
}

export async function downloadPostedRecordsCountFile(
  body: PostedRecordsCountRequest,
  type: "EXCEL" | "CSV",
  signal?: AbortSignal,
): Promise<Blob> {
  const raw = await api.post<unknown>("/report/internal/posted-records-count", { ...body, downloadType: type }, { signal })
  if (!(raw instanceof Blob) || raw.size === 0) {
    throw new Error(`The server did not return a ${type === "EXCEL" ? "spreadsheet" : "CSV"} file`)
  }
  return new Blob([raw], { type: FILE_MIME[type] })
}
