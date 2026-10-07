import { POSTED_RECORDS_ALL_COUNTIES } from "../schemas"
import type { PostedRecordsCountRequest, PostedRecordsOutputType } from "../types"

const EXTENSION: Record<PostedRecordsOutputType, string> = { PDF: "pdf", EXCEL: "xlsx", CSV: "csv" }

export function buildPostedRecordsCountFileName(
  request: Pick<PostedRecordsCountRequest, "nameSpace" | "fiscalYearId">,
  outputType: PostedRecordsOutputType,
): string {
  const scope = request.nameSpace === POSTED_RECORDS_ALL_COUNTIES ? "all-clients" : request.nameSpace
  return `A010-${scope}-${request.fiscalYearId}.${EXTENSION[outputType]}`
}

export function formatCount(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("en-US") : "0"
}

export function formatPrintedOn(date: Date = new Date()): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}

export function saveBlobAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
