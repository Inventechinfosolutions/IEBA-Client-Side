import type { ReportCatalogItem } from "../types"

type SelectMonthByValue = "qtr" | "dates" | "month" | "year" | "scheduled" | "week"

const SELECT_MONTH_BY_ORDER: SelectMonthByValue[] = [
  "month",
  "week",
  "qtr",
  "year",
  "dates",
  "scheduled",
]

function sortSelectMonthByValues(values: SelectMonthByValue[]): SelectMonthByValue[] {
  return SELECT_MONTH_BY_ORDER.filter((value) => values.includes(value))
}

function isCriteriaTrue(val: unknown): boolean {
  return val === true || val === "true"
}

function hasOwn(obj: object | undefined, key: string): boolean {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key)
}

/**
 * Prefer explicit boolean criteria flags (showWeek, showQtr, showMonthly, …).
 * Fall back to showMonthBy[] only when the boolean is not present.
 * Never hardcode report codes — UI is driven entirely by DB criteria.
 */
function resolvePeriodFlag(
  criteria: ReportCatalogItem["criteria"] | undefined,
  booleanKeys: string[],
  monthByType: string,
  monthByOpts: string[] | undefined,
): boolean {
  for (const key of booleanKeys) {
    if (hasOwn(criteria, key)) {
      return isCriteriaTrue((criteria as Record<string, unknown>)[key])
    }
  }
  if (monthByOpts) return monthByOpts.includes(monthByType)
  return false
}

/** Parse report.criteria from DB (string or object). Tolerates trailing commas. */
export function parseReportCriteria(raw: unknown): ReportCatalogItem["criteria"] | undefined {
  if (raw == null || raw === "") return undefined
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ReportCatalogItem["criteria"]
  }
  if (typeof raw !== "string") return undefined
  const cleaned = raw.replace(/\u00A0/g, " ").trim()
  try {
    return JSON.parse(cleaned) as ReportCatalogItem["criteria"]
  } catch {
    try {
      // MySQL/editor pastes sometimes include trailing commas
      const withoutTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1")
      return JSON.parse(withoutTrailingCommas) as ReportCatalogItem["criteria"]
    } catch (error) {
      console.error("Failed to parse report criteria:", raw, error)
      return undefined
    }
  }
}

/** `showYear` → Year inside Select Month By; `showFiscalYear` → Fiscal Year in top row. */
export function resolveReportMonthByFlags(criteria?: ReportCatalogItem["criteria"]) {
  const monthByOpts = criteria?.showMonthBy?.map((o) => o.type)

  return {
    showMonth: resolvePeriodFlag(criteria, ["showMonthly", "monthly"], "month", monthByOpts),
    showWeek: resolvePeriodFlag(criteria, ["showWeek"], "week", monthByOpts),
    showQtr: resolvePeriodFlag(criteria, ["showQtr", "showQuarterSelect"], "qtr", monthByOpts),
    showDates: resolvePeriodFlag(criteria, ["showDates", "showDate"], "dates", monthByOpts),
    showYear: resolvePeriodFlag(criteria, ["showYear"], "year", monthByOpts),
    showScheduled: isCriteriaTrue(criteria?.showScheduleTime),
  }
}

export function resolveShowTopLevelFiscalYear(criteria?: ReportCatalogItem["criteria"]): boolean {
  return isCriteriaTrue(criteria?.showFiscalYear) || isCriteriaTrue(criteria?.showFiscalYearSelect)
}

export function resolveAllowedSelectMonthByValues(
  criteria?: ReportCatalogItem["criteria"],
): SelectMonthByValue[] {
  const flags = resolveReportMonthByFlags(criteria)
  const allowed: SelectMonthByValue[] = []
  if (flags.showMonth) allowed.push("month")
  if (flags.showWeek) allowed.push("week")
  if (flags.showQtr) allowed.push("qtr")
  if (flags.showDates) allowed.push("dates")
  if (flags.showYear) allowed.push("year")
  if (flags.showScheduled) allowed.push("scheduled")

  // If no boolean flags resolved anything but showMonthBy exists, use that list.
  if (allowed.length === 0) {
    const monthByOpts = criteria?.showMonthBy?.map((o) => o.type)
    if (monthByOpts && monthByOpts.length > 0) {
      return sortSelectMonthByValues([...monthByOpts] as SelectMonthByValue[])
    }
  }
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
    const criteria = parseReportCriteria(r.criteria)
    return {
      key: code,
      label: code && name ? `${code} ${name}` : code || name || "Unnamed Report",
      criteria,
    }
  })
}
