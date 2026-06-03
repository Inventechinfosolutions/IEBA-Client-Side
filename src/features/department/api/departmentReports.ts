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

/** GET /report — catalog for department report settings tab. */
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
