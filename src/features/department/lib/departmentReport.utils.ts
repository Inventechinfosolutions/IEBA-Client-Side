import type { DepartmentReportOption } from "../types"

export function formatCountyDisplayName(raw: string | undefined): string {
  const trimmed = raw?.trim() ?? ""
  if (!trimmed) return ""
  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function serializeDepartmentReportIds(ids: readonly (string | number)[]): string {
  return ids.map(String).join(", ")
}

export function parseDepartmentReportIdsForSave(csv: string): number[] {
  return csv
    .split(/[,;\n]+/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0)
}

export function toDepartmentReportOptions(items: unknown[]): DepartmentReportOption[] {
  if (!Array.isArray(items)) return []

  return items
    .map((row) => {
      const r = row as Record<string, unknown>
      const id = Number(r.id)
      const code = String(r.code ?? r.reportCode ?? "").trim()
      const name = String(r.name ?? r.reportName ?? "").trim()
      if (!Number.isFinite(id) || id <= 0) return null
      return {
        id,
        code,
        name,
        label: code && name ? `${code} ${name}` : code || name || String(id),
      }
    })
    .filter((x): x is DepartmentReportOption => x != null)
}

/** Align with Settings → Reports list parsing (`GET /report`). */
export function extractReportListPayload(res: unknown): unknown[] {
  const root = res as {
    data?: { data?: unknown; items?: unknown[] } | unknown[] | { items?: unknown[] }
    items?: unknown[]
  }
  const nested = root?.data
  if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
    const obj = nested as { data?: unknown; items?: unknown[] }
    if (Array.isArray(obj.items)) return obj.items
    if (Array.isArray(obj.data)) return obj.data
  }
  if (Array.isArray(nested)) return nested
  if (Array.isArray(root?.items)) return root.items
  if (Array.isArray(res)) return res
  return []
}
