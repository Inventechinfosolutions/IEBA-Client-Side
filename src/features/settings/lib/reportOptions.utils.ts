import type { ReportOption } from "@/features/settings/types"
import { parseReportMasterCodeDataFromRow } from "@/features/reports/lib/reportMasterCodeData.utils"

export function mapRawReportsToReportOptions(data: unknown[]): ReportOption[] {
  return data.map((row) => {
    const r = row as Record<string, unknown>
    const code = String(r.code ?? r.reportCode ?? "")
    const name = String(r.name ?? r.reportName ?? "")
    const criteria =
      r.criteria == null
        ? null
        : typeof r.criteria === "string"
          ? r.criteria
          : JSON.stringify(r.criteria)
    const { excluded, included } = parseReportMasterCodeDataFromRow(r)
    return {
      key: code,
      label: code && name ? `${code} ${name}` : code || name || "Unnamed Report",
      id: typeof r.id === "number" ? r.id : undefined,
      criteria,
      type: typeof r.type === "string" ? r.type : undefined,
      reportdata: r.reportdata == null ? null : String(r.reportdata),
      filename: r.filename == null ? null : String(r.filename),
      path: r.path == null ? null : String(r.path),
      status: r.status == null ? null : String(r.status),
      excludedMasterCodeData: excluded,
      includedMasterCodeData: included,
    }
  })
}
