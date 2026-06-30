import type { ReportCatalogItem } from "../types"

/** Attach filter `criteria` from the full catalog when mapped rows omit it. */
export function mergeReportCriteriaFromCatalog(
  items: ReportCatalogItem[],
  catalog: ReportCatalogItem[],
): ReportCatalogItem[] {
  if (items.length === 0 || catalog.length === 0) return items
  const catalogByKey = new Map(catalog.map((c) => [c.key, c]))
  return items.map((item) => {
    if (item.criteria) return item
    const full = catalogByKey.get(item.key)
    if (!full?.criteria) return item
    return { ...item, criteria: full.criteria, label: item.label || full.label }
  })
}

/** Normalize raw report rows (catalog or department-mapped) into catalog items. */
function asReportRow(row: unknown): Record<string, unknown> {
  return row !== null && typeof row === "object" ? (row as Record<string, unknown>) : {}
}

export function mapRawReportsToCatalogItems(data: unknown[]): ReportCatalogItem[] {
  return data.map((row) => {
    const r = asReportRow(row)
    const code = String(r.code ?? r.reportCode ?? "")
    const name = String(r.name ?? r.reportName ?? "")
    let criteria: ReportCatalogItem["criteria"] | undefined
    if (r.criteria) {
      try {
        criteria =
          typeof r.criteria === "string"
            ? (JSON.parse(r.criteria.replace(/\u00A0/g, " ")) as ReportCatalogItem["criteria"])
            : (r.criteria as ReportCatalogItem["criteria"])
      } catch (error) {
        console.error(`Failed to parse criteria for report ${code}:`, r.criteria, error)
        criteria = undefined
      }
    }
    return {
      key: code,
      label: code && name ? `${code} ${name}` : code || name || "Unnamed Report",
      criteria,
    }
  })
}
