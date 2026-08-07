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

/** Report ids added or removed since the last server mapping (edit saves only send this diff). */
export function computeChangedDepartmentReportIds(
  existingIds: readonly number[],
  selectedIds: readonly number[],
): number[] {
  const existingSet = new Set(existingIds)
  const selectedSet = new Set(selectedIds)
  const changed: number[] = []

  for (const id of selectedIds) {
    if (!existingSet.has(id)) {
      changed.push(id)
    }
  }
  for (const id of existingIds) {
    if (!selectedSet.has(id)) {
      changed.push(id)
    }
  }

  return [...new Set(changed)]
}

/**
 * Coerce Admin/User visibility flags from API/DB.
 * Never use `value !== false` alone — MySQL TINYINT `0` would become true.
 */
export function coerceReportVisibilityFlag(value: unknown, defaultWhenMissing = true): boolean {
  if (value === undefined || value === null) return defaultWhenMissing
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    if (normalized === "" || normalized === "0" || normalized === "false" || normalized === "no") {
      return false
    }
    if (normalized === "1" || normalized === "true" || normalized === "yes") {
      return true
    }
  }
  return Boolean(value)
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
        visibleToAdmin: coerceReportVisibilityFlag(r.visibleToAdmin, true),
        visibleToUser: coerceReportVisibilityFlag(r.visibleToUser, true),
      }
    })
    .filter((x): x is DepartmentReportOption => x != null)
}

export function buildReportVisibilityPayload(
  reportIds: number[],
  visibilityById: Record<string, { visibleToAdmin: boolean; visibleToUser: boolean }>,
): Array<{ reportId: number; visibleToAdmin: boolean; visibleToUser: boolean }> {
  return reportIds.map((reportId) => {
    const flags = visibilityById[String(reportId)]
    return {
      reportId,
      // Missing flags (legacy / new) default both true; explicit false stays false (hidden).
      visibleToAdmin: flags ? Boolean(flags.visibleToAdmin) : true,
      visibleToUser: flags ? Boolean(flags.visibleToUser) : true,
    }
  })
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
