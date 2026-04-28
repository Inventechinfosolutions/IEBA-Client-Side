import { api } from "@/lib/api"
import type { 
  ReportCatalogItem, 
  ReportRunPayload, 
  ReportSelectOption
} from "./types"

/** Fetches the list of available reports. */
export async function apiGetReportCatalog(): Promise<ReportCatalogItem[]> {
  const resData = await api.get<any>("/report")
  const data = Array.isArray(resData) ? resData : Array.isArray(resData.data) ? resData.data : []

  return data.map((r: any) => {
    const code = r.code || r.reportCode || ""
    const name = r.name || r.reportName || ""
    let criteria: ReportCatalogItem["criteria"] | undefined = undefined
    if (r.criteria) {
      try {
        criteria = typeof r.criteria === "string" ? JSON.parse(r.criteria) : r.criteria
      } catch {
        // malformed criteria string — ignore and leave criteria undefined
      }
    }
    return {
      key: code,
      label: code && name ? `${code} ${name}` : code || name || "Unnamed Report",
      criteria,
    }
  })
}

function formatDateForBackend(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!isoMatch) return trimmed
  const [, yyyy, mm, dd] = isoMatch
  return `${mm}-${dd}-${yyyy}`
}

function monthFromDate(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(trimmed)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`
  }
  return undefined
}

function buildBackendPayload(body: ReportRunPayload, overrideDownloadType?: string): Record<string, unknown> {
  const fromDate = formatDateForBackend(body.dateFrom)
  const toDate = formatDateForBackend(body.dateTo)
  const month = monthFromDate(body.dateFrom)

  return {
    reportCode: body.reportKey,
    reportingPeriodType: body.selectMonthBy,
    fromDate,
    toDate,
    month,
    departmentIds: body.departmentId ? [Number(body.departmentId)] : undefined,
    userIds: body.employeeIds?.length ? body.employeeIds : undefined,
    tsprogramCodes: body.programIds?.length ? body.programIds : undefined,
    activityCodes: body.activityIds?.length ? body.activityIds : undefined,
    costPoolIds: body.costPoolIds?.length ? body.costPoolIds.map(Number) : undefined,
    unApproved: body.includeUnapprovedTime,
    downloadType: overrideDownloadType || body.downloadType,
    type: "newreports",
  }
}

/** Triggers the download of a report via /report/generate. */
export async function apiPostDownloadReport(body: ReportRunPayload, options?: { type?: string; signal?: AbortSignal }): Promise<any> {
  const downloadType = options?.type || body.downloadType
  const payload = buildBackendPayload(body, downloadType)
  return api.post("/report/generate", payload, {
    signal: options?.signal,
    headers: {
      Accept: "application/pdf, application/octet-stream, */*",
    },
  })
}

/** View report data via /report/data. */
export async function apiPostViewReport(body: ReportRunPayload, options?: { signal?: AbortSignal }): Promise<any> {
  // Use the same generation flow as Postman-proven downloads to guarantee file output for in-page preview.
  const payload = buildBackendPayload(body, "PDF")
  return api.post("/report/generate", payload, {
    signal: options?.signal,
    headers: {
      Accept: "application/pdf, application/octet-stream, */*",
    },
  })
}

/** Specialized lookups used by dynamic filters in the Report Form. */

export async function apiGetMaaEmployees(activityTypes: string[], departmentId?: string): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  if (activityTypes.length > 0) params.append("activityTypes", activityTypes.join(","))
  if (departmentId) params.append("departmentId", departmentId)

  const data = await api.get<any>(`/report/maa/employees?${params.toString()}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetCostPoolUsers(costPoolIds: string[], userId: string, employeeStatus?: string[]): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  if (costPoolIds.length > 0) params.append("costPoolIds", costPoolIds.join(","))
  params.append("userId", userId)
  if (employeeStatus && employeeStatus.length > 0) params.append("employeeStatus", employeeStatus.join(","))

  const data = await api.get<any>(`/report/cost-pools/users?${params.toString()}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetMaaTcmActivityDepartments(): Promise<ReportSelectOption[]> {
  const data = await api.get<any>("/report/maa-tcm/activity-departments")
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetTimeStudyProgramsForUsers(
  userIds: string[],
  dateFrom: string,
  dateTo: string,
  status: string = "active",
): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  if (userIds.length > 0) params.append("userIds", userIds.join(","))
  params.append("dateFrom", dateFrom)
  params.append("dateTo", dateTo)
  params.append("status", status)

  const data = await api.get<any>(`/report/timestudy-programs/by-users?${params.toString()}`)
  const list = unwrapListData(data)

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label || r.code || String(r.id),
  }))
}

export async function apiGetListAllPrograms(): Promise<ReportSelectOption[]> {
  const data = await api.get<any>("/timestudyprograms?method=listalltimestudyprograms")
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetUsersUnderDepartment(departmentId: string, currentUserId: string): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  params.append("type", "getusersunderdepartmentbystatus")
  params.append("departmentId", departmentId)
  params.append("departmentStatus", "active")
  params.append("userId", currentUserId)

  const data = await api.get<any>(`/users?${params.toString()}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label || `${r.firstName || ""} ${r.lastName || ""}`.trim(),
  }))
}

function unwrapListData(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") {
    const d = "data" in raw ? (raw as any).data : raw
    if (Array.isArray(d)) return d
    if (d && typeof d === "object" && Array.isArray((d as any).data)) return (d as any).data
  }
  return []
}

/** Reports filter: activities available for a department (optionally scoped by users). */
export async function apiGetActivitiesByDepartmentAndUsers(
  departmentId: string,
  _userIds: string[],
): Promise<ReportSelectOption[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "1000")
  search.set("departmentId", departmentId)

  const raw = await api.get<any>(`/activity-departments?${search.toString()}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.id ?? r.activityDepartmentId ?? r.activityId ?? ""),
      label: r.name || r.label || r.code || String(r.id ?? ""),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}

/** Reports filter: cost pools available for a department. */
export async function apiGetCostPoolsByDepartment(departmentId: string): Promise<ReportSelectOption[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "1000")
  search.set("departmentId", departmentId)
  search.set("costpoolStatus", "active")

  const raw = await api.get<any>(`/costpool?${search.toString()}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.id ?? ""),
      label: r.name || r.label || String(r.id ?? ""),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}

export async function apiGetRmtsPayPeriods(
  fiscalYear: string,
  departmentId: string,
): Promise<ReportSelectOption[]> {
  const search = new URLSearchParams()
  search.set("fiscalyear", fiscalYear)
  search.set("departmentId", departmentId)

  const raw = await api.get<any>(`/rmtspayperiods?${search.toString()}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.id || r.payPeriodId || r.value || ""),
      label: r.name || r.label || r.description || String(r.id || ""),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}
