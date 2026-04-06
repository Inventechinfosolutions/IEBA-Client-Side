import { api } from "@/lib/api"
import { getDepartments } from "@/features/department/api/departments"
import type { ApiResponseDto } from "@/features/user/types"

import type {
  AddEmployeeActivityCatalogRow,
  AddEmployeeActivityListPayload,
  AddEmployeeCountyActivityRow,
  AddEmployeeDepartmentOption,
  AddEmployeeDepartmentRolesListPayload,
  AddEmployeeJobClassificationListPayload,
  AddEmployeeJobClassificationRow,
  AddEmployeeJobPoolListPayload,
  AddEmployeeJobPoolRow,
  AddEmployeeMasterCodeListPayload,
  AddEmployeeMasterCodeRow,
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeTimeStudyProgramRow,
} from "./types"

function unwrapSuccess<T>(res: ApiResponseDto<T>, failureMessage: string): T {
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? failureMessage)
  }
  return res.data
}

function isActiveStatus(status: unknown): boolean {
  if (typeof status === "boolean") return status
  if (typeof status === "string") return status.toLowerCase() === "active"
  return true
}

function isJobPoolRow(row: unknown): row is AddEmployeeJobPoolRow {
  if (row === null || typeof row !== "object") return false
  const r = row as Record<string, unknown>
  return typeof r.id === "number" && typeof r.name === "string" && typeof r.departmentId === "number"
}

function isActivityCatalogRow(row: unknown): row is AddEmployeeActivityCatalogRow {
  if (row === null || typeof row !== "object") return false
  const r = row as Record<string, unknown>
  return typeof r.id === "number" && typeof r.code === "string" && typeof r.name === "string"
}

export async function fetchAddEmployeeJobClassifications(): Promise<AddEmployeeJobClassificationRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<AddEmployeeJobClassificationListPayload>>(
    `/jobclassification?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load job classifications")
  return payload.data
}

function normalizeCountyActivityPayload(payload: unknown): AddEmployeeCountyActivityRow[] {
  let list: unknown[] = []
  if (Array.isArray(payload)) {
    list = payload
  } else if (payload !== null && typeof payload === "object" && "data" in payload) {
    const d = (payload as { data: unknown }).data
    if (Array.isArray(d)) list = d
  }

  const out: AddEmployeeCountyActivityRow[] = []
  for (const raw of list) {
    if (raw === null || typeof raw !== "object") continue
    const r = raw as Record<string, unknown>
    const idRaw = r.id ?? r.countyActivityId ?? r.county_activity_id
    const id =
      typeof idRaw === "number" || typeof idRaw === "string" ? String(idRaw).trim() : ""
    if (!id) continue
    const code =
      typeof r.countyActivityCode === "string"
        ? r.countyActivityCode
        : typeof r.code === "string"
          ? r.code
          : undefined
    const name =
      typeof r.countyActivityName === "string"
        ? r.countyActivityName
        : typeof r.name === "string"
          ? r.name
          : undefined
    out.push({
      id,
      ...(code ? { countyActivityCode: code } : {}),
      ...(name ? { countyActivityName: name } : {}),
    })
  }
  return out
}

/**
 * Lists tenant activity codes (used as “county activity” in Add Employee).
 * Backend exposes this as GET /activity-codes (there is no /countyactivity route).
 */
export async function fetchListCountyActivity(): Promise<AddEmployeeCountyActivityRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<{ data: unknown[]; meta?: unknown }>>(
    `/activity-codes?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load activity codes")
  return normalizeCountyActivityPayload(payload)
}

export async function fetchAddEmployeeJobPools(): Promise<AddEmployeeJobPoolRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")

  const res = await api.get<
    ApiResponseDto<AddEmployeeJobPoolListPayload | unknown>
  >(`/jobpool?${search.toString()}`)

  const payload = unwrapSuccess(res, "Failed to load job pools")

  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as AddEmployeeJobPoolListPayload).data) &&
    (payload as AddEmployeeJobPoolListPayload).data.every((item) => isJobPoolRow(item))
  ) {
    return (payload as AddEmployeeJobPoolListPayload).data
  }

  throw new Error("Unexpected job pool list response shape")
}

export async function fetchAddEmployeeActivitiesCatalog(): Promise<AddEmployeeActivityCatalogRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")

  const res = await api.get<ApiResponseDto<AddEmployeeActivityListPayload>>(
    `/activities?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load activities")
  return payload.data
}

export async function fetchAddEmployeeDepartments(): Promise<AddEmployeeDepartmentOption[]> {
  const { items } = await getDepartments({ page: 1, limit: 100, status: "active" })
  return items.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
  }))
}

export async function fetchDepartmentRolesCatalog(): Promise<AddEmployeeSecurityRoleCatalogItem[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<AddEmployeeDepartmentRolesListPayload>>(
    `/department-roles?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load department roles")
  const out: AddEmployeeSecurityRoleCatalogItem[] = []

  for (const dept of payload.data) {
    for (const dr of dept.departmentroles ?? []) {
      if (dr.isAdmin) continue
      const st = typeof dr.status === "string" ? dr.status.toLowerCase() : ""
      if (st && st !== "active") continue
      const roleName = dr.role?.name?.trim() ?? ""
      if (!roleName) continue
      out.push({
        id: `${dept.id}-${dr.id}`,
        name: roleName,
        department: dept.name,
      })
    }
  }

  return out
}

export async function fetchAddEmployeeTimeStudyPrograms(): Promise<AddEmployeeTimeStudyProgramRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<{ data: unknown[] }>>(
    `/timestudyprograms?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load time study programs")
  const list = Array.isArray(payload.data) ? payload.data : []
  const out: AddEmployeeTimeStudyProgramRow[] = []

  for (const raw of list) {
    if (raw === null || typeof raw !== "object") continue
    const p = raw as Record<string, unknown>
    if (!isActiveStatus(p.status)) continue
    const idRaw = p.id
    const name = typeof p.name === "string" ? p.name.trim() : ""
    if (!name) continue
    const idStr =
      typeof idRaw === "number" || typeof idRaw === "string" ? String(idRaw).trim() : ""
    if (!idStr) continue
    const code = typeof p.code === "string" ? p.code : ""
    const deptRaw = p.department
    const department =
      deptRaw !== null &&
      typeof deptRaw === "object" &&
      typeof (deptRaw as { name?: unknown }).name === "string"
        ? String((deptRaw as { name: string }).name).trim()
        : ""
    out.push({
      id: idStr,
      code,
      name,
      department,
    })
  }

  return out
}

function normalizeMasterCodeRow(raw: unknown): AddEmployeeMasterCodeRow | null {
  if (raw === null || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const id = o.id
  const name = typeof o.name === "string" ? o.name.trim() : ""
  if (typeof id !== "number" || !name) return null
  const allowRaw = o.allowMulticode ?? o.allow_multicode
  const allowMulticode = allowRaw === true
  const status = typeof o.status === "string" ? o.status.toLowerCase() : ""
  return { id, name, allowMulticode, status }
}

/**
 * GET /master-codes?page=1&limit=100 (tenant list). Filters to active rows with allowMulticode true.
 */
export async function fetchMulticodeMasterCodes(): Promise<AddEmployeeMasterCodeRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")

  const res = await api.get<ApiResponseDto<AddEmployeeMasterCodeListPayload>>(
    `/master-codes?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load master codes")
  const list = Array.isArray(payload.data) ? payload.data : []
  const rows: AddEmployeeMasterCodeRow[] = []

  for (const raw of list) {
    const row = normalizeMasterCodeRow(raw)
    if (!row) continue
    if (!row.allowMulticode) continue
    if (row.status && row.status !== "active") continue
    rows.push(row)
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}
