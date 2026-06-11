import type { ReportFormValues } from "../types"

const LEGACY_STORAGE_KEY = "ieba.reports.formParams"

let retainedReportFormParams: ReportFormValues | null = null

function isRetainEnabled(value: unknown): boolean {
  return value === true || value === "true"
}

/** Drop legacy sessionStorage persistence from older builds (survived refresh). */
function clearLegacySessionStorage(): void {
  try {
    sessionStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {}
}

clearLegacySessionStorage()

/** In-memory only: survives SPA navigation, cleared on refresh/logout. */
export function readStoredReportFormParams(): Partial<ReportFormValues> | null {
  clearLegacySessionStorage()
  if (!retainedReportFormParams || !isRetainEnabled(retainedReportFormParams.retainParameters)) {
    return null
  }
  return retainedReportFormParams
}

export function writeStoredReportFormParams(values: ReportFormValues): void {
  if (!values.retainParameters) {
    clearStoredReportFormParams()
    return
  }
  retainedReportFormParams = values
}

export function clearStoredReportFormParams(): void {
  retainedReportFormParams = null
  clearLegacySessionStorage()
}
