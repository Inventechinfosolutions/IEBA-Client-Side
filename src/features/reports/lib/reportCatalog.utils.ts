import type { ReportCatalogItem } from "../types"

type SelectMonthByValue = "qtr" | "dates" | "month" | "year" | "scheduled"

function isCriteriaTrue(val: unknown): boolean {
  return val === true || val === "true"
}

/** `showYear` → Year inside Select Month By; `showFiscalYear` → Fiscal Year in top row. */
export function resolveReportMonthByFlags(criteria?: ReportCatalogItem["criteria"]) {
  const monthByOpts = criteria?.showMonthBy?.map((o) => o.type)
  return {
    showQtr: monthByOpts
      ? monthByOpts.includes("qtr")
      : isCriteriaTrue(criteria?.showQuarterSelect) || isCriteriaTrue(criteria?.showQtr),
    showDates: monthByOpts
      ? monthByOpts.includes("dates")
      : isCriteriaTrue(criteria?.showDate) || isCriteriaTrue(criteria?.showDates),
    showMonth: monthByOpts
      ? monthByOpts.includes("month")
      : isCriteriaTrue(criteria?.monthly) || isCriteriaTrue(criteria?.showMonthly),
    showYear: monthByOpts
      ? monthByOpts.includes("year") || isCriteriaTrue(criteria?.showYear)
      : isCriteriaTrue(criteria?.showYear),
    showScheduled: isCriteriaTrue(criteria?.showScheduleTime),
  }
}

export function resolveShowTopLevelFiscalYear(criteria?: ReportCatalogItem["criteria"]): boolean {
  return isCriteriaTrue(criteria?.showFiscalYear) || isCriteriaTrue(criteria?.showFiscalYearSelect)
}

export function resolveAllowedSelectMonthByValues(
  criteria?: ReportCatalogItem["criteria"],
): SelectMonthByValue[] {
  const monthByOpts = criteria?.showMonthBy?.map((o) => o.type)
  if (monthByOpts && monthByOpts.length > 0) {
    const allowed = [...monthByOpts] as SelectMonthByValue[]
    if (isCriteriaTrue(criteria?.showYear) && !allowed.includes("year")) {
      allowed.push("year")
    }
    return allowed
  }
  const flags = resolveReportMonthByFlags(criteria)
  const allowed: SelectMonthByValue[] = []
  if (flags.showMonth) allowed.push("month")
  if (flags.showQtr) allowed.push("qtr")
  if (flags.showDates) allowed.push("dates")
  if (flags.showYear) allowed.push("year")
  if (flags.showScheduled) allowed.push("scheduled")
  return allowed
}

export function resolveDefaultSelectMonthBy(
  criteria?: ReportCatalogItem["criteria"],
): SelectMonthByValue | undefined {
  const allowed = resolveAllowedSelectMonthByValues(criteria)
  return allowed[0]
}

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
