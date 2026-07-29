import { api } from "@/lib/api"
import {
  extractReportListPayload,
  toDepartmentReportOptions,
} from "@/features/department/lib/departmentReport.utils"
import type { DepartmentReportOption } from "@/features/department/types"
import { mapRawReportsToReportOptions } from "@/features/settings/lib/reportOptions.utils"
import type { ReportOption } from "@/features/settings/types"

export type CountyReportsMapResDto = {
  nameSpace?: string
  countyName: string
  reportIds: number[]
  reports: unknown[]
}

export type CountyAssignedUnassignedResDto = {
  assigned: DepartmentReportOption[]
  unassigned: DepartmentReportOption[]
}

/** GET /report/county/assigned-unassigned */
export async function getCountyAssignedUnassignedReports(): Promise<CountyAssignedUnassignedResDto> {
  const res = await api.get<unknown>("/report/county/assigned-unassigned")
  const payload = (res as { data?: { assigned?: unknown[]; unassigned?: unknown[] } })?.data ?? res
  const body = payload as { assigned?: unknown[]; unassigned?: unknown[] }
  return {
    assigned: toDepartmentReportOptions(body.assigned ?? []),
    unassigned: toDepartmentReportOptions(body.unassigned ?? []),
  }
}

/** GET /report/county/mapped */
export async function getCountyMappedReports(options?: {
  method?: "reportscreen"
}): Promise<CountyReportsMapResDto> {
  const params = options?.method ? new URLSearchParams({ method: options.method }) : null
  const url = params ? `/report/county/mapped?${params.toString()}` : "/report/county/mapped"
  const res = await api.get<unknown>(url)
  return (res as { data?: CountyReportsMapResDto })?.data ?? (res as CountyReportsMapResDto)
}

/** Slim county-mapped reports for dropdowns. */
export async function getCountyMappedReportOptions(): Promise<ReportOption[]> {
  const body = await getCountyMappedReports({ method: "reportscreen" })
  const reports = Array.isArray(body?.reports) ? body.reports : []
  return mapRawReportsToReportOptions(reports)
}

/** POST /report/county/map — replaces county mapping. */
export async function mapCountyReports(reportIds: number[]): Promise<CountyReportsMapResDto> {
  const res = await api.post<unknown>("/report/county/map", { reportIds })
  return (res as { data?: CountyReportsMapResDto })?.data ?? (res as CountyReportsMapResDto)
}

/** Full report catalog (active) as department-style options. */
export async function getAllReportOptionsForCountyMapping(): Promise<DepartmentReportOption[]> {
  const res = await api.get<unknown>("/report")
  return toDepartmentReportOptions(extractReportListPayload(res))
}
