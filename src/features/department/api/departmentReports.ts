import { api } from "@/lib/api"
import {
  extractReportListPayload,
  toDepartmentReportOptions,
} from "../lib/departmentReport.utils"
import type {
  DepartmentReportOption,
  DepartmentReportsMapResDto,
  MapDepartmentReportsReqDto,
} from "../types"

/**
 * @deprecated Do not use for Department Report Setting / Reports mapping.
 * Full catalog belongs only in Settings → county report mapping.
 * Prefer `getAssignedAndUnassignedReports` (mapped) or `getCountyMappedReportOptions` (pool).
 */
export async function getDepartmentReportOptions(): Promise<DepartmentReportOption[]> {
  const res = await api.get<unknown>("/report")
  return toDepartmentReportOptions(extractReportListPayload(res))
}

export type GetDepartmentMappedReportsOptions = {
  /** `reportscreen` = slim report rows; omit for full master-code buckets. */
  method?: "reportscreen"
}

/** GET /departments/:departmentId/reports */
export async function getDepartmentMappedReports(
  departmentId: string,
  options?: GetDepartmentMappedReportsOptions,
): Promise<DepartmentReportsMapResDto> {
  const params = options?.method ? new URLSearchParams({ method: options.method }) : null
  const url = params
    ? `/departments/${encodeURIComponent(departmentId)}/reports?${params.toString()}`
    : `/departments/${encodeURIComponent(departmentId)}/reports`
  const res = await api.get<unknown>(url)
  return (res as { data?: DepartmentReportsMapResDto })?.data ?? (res as DepartmentReportsMapResDto)
}

/** POST /departments/reports/map */
export async function mapDepartmentReports(
  body: MapDepartmentReportsReqDto,
): Promise<DepartmentReportsMapResDto> {
  const res = await api.post<unknown>("/departments/reports/map", body)
  return (res as { data?: DepartmentReportsMapResDto })?.data ?? (res as DepartmentReportsMapResDto)
}

export type AssignedUnassignedReportsResDto = {
  assigned: DepartmentReportOption[]
  unassigned: DepartmentReportOption[]
}

/** GET /departments/:departmentId/reports/assigned-unassigned */
export async function getAssignedAndUnassignedReports(
  departmentId: string,
): Promise<AssignedUnassignedReportsResDto> {
  const res = await api.get<unknown>(
    `/departments/${encodeURIComponent(departmentId)}/reports/assigned-unassigned`,
  )
  const payload = (res as { data?: any })?.data ?? res
  
  return {
    assigned: toDepartmentReportOptions(payload.assigned ?? []),
    unassigned: toDepartmentReportOptions(payload.unassigned ?? []),
  }
}

/** PUT /departments/:departmentId (standard update department endpoint) */
export async function updateAssignedAndUnassignedReports(
  departmentId: string,
  reportIds: number[],
): Promise<unknown> {
  const res = await api.put<unknown>(
    `/departments/${encodeURIComponent(departmentId)}`,
    { reportIds },
  )
  return res
}

export type UpsertDepartmentReportConfigBody = {
  type: "included" | "excluded"
  excludedMasterCodeData: {
    masterCodeIds: number[]
    activityCodes: string[]
  }
  includedMasterCodeData: {
    masterCodeIds: number[]
    activityCodes: string[]
  }
  includedProgramCodes?: string[]
  excludedProgramCodes?: string[]
  category1Programs?: string[]
  category2Programs?: string[]
  category3Programs?: string[]
}

/** GET /departments/:departmentId/reports/:reportId/config */
export async function getDepartmentReportConfig(
  departmentId: string,
  reportId: number,
): Promise<Record<string, unknown>> {
  const res = await api.get<unknown>(
    `/departments/${encodeURIComponent(departmentId)}/reports/${reportId}/config`,
  )
  return ((res as { data?: Record<string, unknown> })?.data ?? res) as Record<string, unknown>
}

/** PUT /departments/:departmentId/reports/:reportId/config */
export async function upsertDepartmentReportConfig(
  departmentId: string,
  reportId: number,
  body: UpsertDepartmentReportConfigBody,
): Promise<Record<string, unknown>> {
  const res = await api.put<unknown>(
    `/departments/${encodeURIComponent(departmentId)}/reports/${reportId}/config`,
    body,
  )
  return ((res as { data?: Record<string, unknown> })?.data ?? res) as Record<string, unknown>
}
