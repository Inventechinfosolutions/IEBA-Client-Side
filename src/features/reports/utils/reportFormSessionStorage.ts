import type { ReportFormValues } from "../types"

const STORAGE_KEY = "ieba.reports.formParams"

export function readStoredReportFormParams(): Partial<ReportFormValues> | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return null
    return parsed as Partial<ReportFormValues>
  } catch {
    return null
  }
}

export function writeStoredReportFormParams(values: ReportFormValues): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values))
  } catch {}
}
