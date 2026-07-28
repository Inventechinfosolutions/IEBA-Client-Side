import type { ReportOption, ReportProgramItem } from "@/features/settings/types"
import { parseReportMasterCodeDataFromRow } from "@/features/reports/lib/reportMasterCodeData.utils"

function parseProgramItems(raw: unknown): ReportProgramItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const r = row as Record<string, unknown>
      const id = Number(r.id)
      const code = String(r.code ?? "").trim()
      const name = String(r.name ?? "").trim() || code
      if (!Number.isFinite(id) || id <= 0 || !code) return null
      return { id, code, name }
    })
    .filter((x): x is ReportProgramItem => x != null)
}

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
    const configKind = r.configKind === "programs" ? "programs" : "masterCodes"
    const programFlag =
      r.programFlag && typeof r.programFlag === "object"
        ? {
            included: parseProgramItems((r.programFlag as Record<string, unknown>).included),
            excluded: parseProgramItems((r.programFlag as Record<string, unknown>).excluded),
          }
        : undefined
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
      configKind,
      includedProgramCodes: Array.isArray(r.includedProgramCodes)
        ? r.includedProgramCodes.map((c) => String(c).trim()).filter(Boolean)
        : programFlag?.included.map((p) => p.code) ?? [],
      excludedProgramCodes: Array.isArray(r.excludedProgramCodes)
        ? r.excludedProgramCodes.map((c) => String(c).trim()).filter(Boolean)
        : programFlag?.excluded.map((p) => p.code) ?? [],
      category1Programs: Array.isArray(r.category1Programs)
        ? r.category1Programs.map((c) => String(c).trim()).filter(Boolean)
        : [],
      category2Programs: Array.isArray(r.category2Programs)
        ? r.category2Programs.map((c) => String(c).trim()).filter(Boolean)
        : [],
      category3Programs: Array.isArray(r.category3Programs)
        ? r.category3Programs.map((c) => String(c).trim()).filter(Boolean)
        : [],
      programFlag,
    }
  })
}
