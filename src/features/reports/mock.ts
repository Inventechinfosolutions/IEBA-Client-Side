import type {
  ReportMockActiveRow,
  ReportMockDepartment,
  ReportMockFiscalYear,
} from "./types"

/** Placeholder fiscal years until Reports uses a dedicated API. */
export const MOCK_FISCAL_YEAR_OPTIONS = [
  { id: "2025-2026", label: "2025-2026" },
  { id: "2024-2025", label: "2024-2025" },
  { id: "2023-2024", label: "2023-2024" },
  { id: "2022-2023", label: "2022-2023" },
  { id: "2021-2022", label: "2021-2022" },
  { id: "2020-2021", label: "2020-2021" },
  { id: "2019-2020", label: "2019-2020" },
] as const satisfies readonly ReportMockFiscalYear[]

/** Placeholder departments until Reports uses a dedicated API. */
export const MOCK_DEPARTMENT_OPTIONS = [
  { id: "dept-bh", label: "BH — Behavioral Health" },
  { id: "dept-fin", label: "FIN — Finance" },
  { id: "dept-hr", label: "HR — Human Resources" },
  { id: "dept-it", label: "IT — Information Technology" },
  { id: "dept-pw", label: "PW — Public Works" },
] as const satisfies readonly ReportMockDepartment[]

/** Placeholder employees; `active` drives filtering with Active/Inactive checkboxes. */
export const MOCK_EMPLOYEES = [
  { id: "emp-teuton", label: "Teuton Kyle", active: true },
  { id: "emp-morgan", label: "Morgan Lee", active: true },
  { id: "emp-jordan", label: "Jordan Smith", active: true },
  { id: "emp-riley", label: "Riley Chen", active: true },
  { id: "emp-casey", label: "Casey Brown", active: false },
  { id: "emp-avery", label: "Avery Jones", active: false },
  { id: "emp-quinn", label: "Quinn Davis", active: true },
  { id: "emp-skye", label: "Skye Wilson", active: false },
] as const satisfies readonly ReportMockActiveRow[]

/** Placeholder activities until Reports uses a dedicated API. */
export const MOCK_ACTIVITIES = [
  { id: "act-intake", label: "Intake / Assessment", active: true },
  { id: "act-direct", label: "Direct Service", active: true },
  { id: "act-admin", label: "Administrative", active: true },
  { id: "act-train", label: "Training", active: false },
  { id: "act-other", label: "Other Program", active: false },
] as const satisfies readonly ReportMockActiveRow[]

/** Placeholder cost pools until Reports uses a dedicated API. */
export const MOCK_COST_POOLS = [
  { id: "cp-gen", label: "General Fund", active: true },
  { id: "cp-grant", label: "Grant A", active: true },
  { id: "cp-mh", label: "Mental Health Block", active: true },
  { id: "cp-legacy", label: "Legacy Pool", active: false },
] as const satisfies readonly ReportMockActiveRow[]

export function filterReportMockRows<T extends { active: boolean }>(
  rows: readonly T[],
  includeActive: boolean,
  includeInactive: boolean,
): T[] {
  return rows.filter((row) => {
    if (!includeActive && !includeInactive) return true
    if (includeActive && row.active) return true
    if (includeInactive && !row.active) return true
    return false
  })
}
