import { api } from "@/lib/api"
import { getDepartments } from "@/features/department/api/departments"
import type { ApiResponseDto } from "@/features/user/types"

import type {
  AddEmployeeActivityCatalogRow,
  AddEmployeeActivityDepartmentRow,
  AddEmployeeActivityListPayload,
  AddEmployeeCountyActivityRow,
  AddEmployeeDepartmentOption,
  AddEmployeeDepartmentRolesListPayload,
  AddEmployeeJobClassificationListPayload,
  AddEmployeeJobClassificationRow,
  AddEmployeeJobPoolListPayload,
  AddEmployeeJobPoolRow,
  AddEmployeeLocationListPayload,
  AddEmployeeLocationRow,
  AddEmployeeMasterCodeListPayload,
  AddEmployeeMasterCodeRow,
  AddEmployeeDepartmentSupervisorRow,
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeTimeStudyProgramRow,
  AssignUserActivitiesApiBody,
  AssignUserProgramsApiBody,
  UserDepartmentRoleDepartmentsBody,
  UserProgramsActivitiesDepartmentBundle,
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

function isAddEmployeeLocationRow(row: unknown): row is AddEmployeeLocationRow {
  if (row === null || typeof row !== "object") return false
  const r = row as Record<string, unknown>
  return typeof r.id === "number" && typeof r.name === "string"
}

/**
 * Supports both `{ data: rows, meta }` and a bare `rows[]` envelope from GET /location.
 */
function normalizeLocationListRows(payload: unknown): AddEmployeeLocationRow[] {
  if (Array.isArray(payload)) {
    return payload.filter(isAddEmployeeLocationRow)
  }
  if (payload !== null && typeof payload === "object" && "data" in payload) {
    const inner = (payload as { data: unknown }).data
    if (Array.isArray(inner)) return inner.filter(isAddEmployeeLocationRow)
  }
  return []
}

/**
 * GET /location — active locations for the Employee/Login Details picker.
 * Paginated API: single page with max limit (backend max 100).
 */
export async function fetchAddEmployeeLocations(): Promise<AddEmployeeLocationRow[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<AddEmployeeLocationListPayload | AddEmployeeLocationRow[]>>(
    `/location?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load locations")
  return normalizeLocationListRows(payload).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  )
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
  return payload.data.filter(isActivityCatalogRow)
}

function normalizeActivityDepartmentListRow(raw: unknown): AddEmployeeActivityDepartmentRow | null {
  if (raw === null || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const id = r.id
  const activityId = r.activityId
  const departmentId = r.departmentId
  if (typeof id !== "number" || typeof activityId !== "number" || typeof departmentId !== "number") {
    return null
  }
  const code = typeof r.code === "string" ? r.code.trim() : ""
  const name = typeof r.name === "string" ? r.name.trim() : ""
  const status = typeof r.status === "string" ? r.status.trim() : ""
  if (!code && !name) return null
  return { id, activityId, departmentId, code, name, status }
}

/**
 * Activity–department links for one department (paginated). Ids are ActivityDepartment rows — use for
 * POST /users/new/assign/activity `countyActivity` (not master Activity.id from GET /activities).
 */
export async function fetchActivityDepartmentsForDepartment(
  departmentId: number,
): Promise<AddEmployeeActivityDepartmentRow[]> {
  const all: AddEmployeeActivityDepartmentRow[] = []
  let page = 1
  const limit = 1000
  const maxPages = 20
  while (page <= maxPages) {
    const search = new URLSearchParams()
    search.set("page", String(page))
    search.set("limit", String(limit))
    search.set("departmentId", String(departmentId))
    const res = await api.get<
      ApiResponseDto<{
        data: unknown[]
        meta?: { totalItems?: number }
      }>
    >(`/activity-departments?${search.toString()}`)
    const payload = unwrapSuccess(res, "Failed to load activity departments for department")
    const list = Array.isArray(payload.data) ? payload.data : []
    for (const raw of list) {
      const row = normalizeActivityDepartmentListRow(raw)
      if (row) all.push(row)
    }
    const totalItems = payload.meta?.totalItems ?? 0
    if (list.length < limit) break
    if (totalItems > 0 && all.length >= totalItems) break
    page += 1
  }
  return all
}

export async function fetchAddEmployeeDepartments(): Promise<AddEmployeeDepartmentOption[]> {
  const { items } = await getDepartments({ page: 1, limit: 100, status: "active" })
  return items.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
  }))
}

function departmentRowsWithRolesFromListPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload !== null && typeof payload === "object") {
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.data)) return p.data
  }
  return []
}

function flattenDepartmentsRolesToSecurityItems(
  payload: unknown,
): AddEmployeeSecurityRoleCatalogItem[] {
  const rows = departmentRowsWithRolesFromListPayload(payload)
  const out: AddEmployeeSecurityRoleCatalogItem[] = []
  for (const raw of rows) {
    if (raw === null || typeof raw !== "object") continue
    const d = raw as Record<string, unknown>
    const deptIdRaw = d.id
    const deptId = typeof deptIdRaw === "number" ? deptIdRaw : Number(deptIdRaw)
    const deptName = typeof d.name === "string" ? d.name.trim() : ""
    if (!Number.isFinite(deptId) || !deptName) continue
    const roles = d.roles
    if (!Array.isArray(roles)) continue
    for (const r of roles) {
      if (r === null || typeof r !== "object") continue
      const role = r as Record<string, unknown>
      const roleIdRaw = role.id
      const roleId = typeof roleIdRaw === "number" ? roleIdRaw : Number(roleIdRaw)
      const roleName = typeof role.name === "string" ? role.name.trim() : ""
      if (!Number.isFinite(roleId) || !roleName) continue
      out.push({
        id: `${deptId}-${roleId}`,
        name: roleName,
        department: deptName,
      })
    }
  }
  return out
}

/**
 * GET /departments/user/roles-unassigned — departments with roles not yet assigned to the user.
 * Omit `userId` for “all assignable roles” (new user before draft id exists).
 */
export async function fetchDepartmentRolesUnassigned(options?: {
  userId?: string
}): Promise<AddEmployeeSecurityRoleCatalogItem[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "100")
  search.set("sort", "ASC")
  const uid = options?.userId?.trim()
  if (uid) search.set("userId", uid)

  const res = await api.get<ApiResponseDto<unknown>>(
    `/departments/user/roles-unassigned?${search.toString()}`,
  )
  const payload = unwrapSuccess(res, "Failed to load unassigned department roles")
  return flattenDepartmentsRolesToSecurityItems(payload)
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

function parseUserProgramsActivitiesBundle(raw: unknown): UserProgramsActivitiesDepartmentBundle | null {
  if (raw === null || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const departmentId = typeof b.departmentId === "number" ? b.departmentId : Number(b.departmentId)
  const departmentCode = typeof b.departmentCode === "string" ? b.departmentCode : ""
  const departmentName = typeof b.departmentName === "string" ? b.departmentName.trim() : ""
  if (!Number.isFinite(departmentId) || !departmentName) return null

  const programs: UserProgramsActivitiesDepartmentBundle["programs"] = []
  const activities: UserProgramsActivitiesDepartmentBundle["activities"] = []

  if (Array.isArray(b.programs)) {
    for (const pr of b.programs) {
      if (pr === null || typeof pr !== "object") continue
      const p = pr as Record<string, unknown>
      const id = typeof p.id === "number" ? p.id : Number(p.id)
      const name = typeof p.name === "string" ? p.name.trim() : ""
      if (!Number.isFinite(id) || !name) continue
      const code = typeof p.code === "string" ? p.code : ""
      const pid = typeof p.departmentId === "number" ? p.departmentId : Number(p.departmentId)
      programs.push({
        id,
        code,
        name,
        departmentId: Number.isFinite(pid) ? pid : departmentId,
      })
    }
  }

  if (Array.isArray(b.activities)) {
    for (const ar of b.activities) {
      if (ar === null || typeof ar !== "object") continue
      const a = ar as Record<string, unknown>
      const id = typeof a.id === "number" ? a.id : Number(a.id)
      const name = typeof a.name === "string" ? a.name.trim() : ""
      if (!Number.isFinite(id) || !name) continue
      const code = typeof a.code === "string" ? a.code : ""
      const aid = typeof a.departmentId === "number" ? a.departmentId : Number(a.departmentId)
      activities.push({
        id,
        code,
        name,
        departmentId: Number.isFinite(aid) ? aid : departmentId,
      })
    }
  }

  return { departmentId, departmentCode, departmentName, programs, activities }
}

/**
 * GET /timestudyprograms/user/programs-activities?userId= — programs and activities per department
 * from the user’s active department-role assignments (edit mode Time Study tab).
 */
export async function fetchUserProgramsAndActivities(
  userId: string,
): Promise<UserProgramsActivitiesDepartmentBundle[]> {
  const uid = userId.trim()
  if (!uid) {
    throw new Error("userId is required")
  }
  const search = new URLSearchParams()
  search.set("userId", uid)
  const res = await api.get<ApiResponseDto<unknown>>(
    `/timestudyprograms/user/programs-activities?${search.toString()}`,
  )
  const payload = unwrapSuccess(res, "Failed to load user programs and activities")
  const list = Array.isArray(payload) ? payload : []
  const out: UserProgramsActivitiesDepartmentBundle[] = []
  for (const row of list) {
    const bundle = parseUserProgramsActivitiesBundle(row)
    if (bundle) out.push(bundle)
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

function isDepartmentSupervisorRow(row: unknown): row is AddEmployeeDepartmentSupervisorRow {
  if (row === null || typeof row !== "object") return false
  const r = row as Record<string, unknown>
  return (
    typeof r.id === "string" &&
    typeof r.loginId === "string" &&
    typeof r.firstName === "string" &&
    typeof r.lastName === "string" &&
    typeof r.name === "string" &&
    typeof r.employeeId === "string"
  )
}

/** Display string for supervisor pickers (matches list row style). */
export function supervisorPickerDisplayName(row: AddEmployeeDepartmentSupervisorRow): string {
  const fromNames = `${row.firstName} ${row.lastName}`.trim()
  return fromNames || row.name.trim() || row.loginId.trim()
}

/**
 * GET /users/supervisors?departmentIds=1,2,3 — active users with supervisor role in those departments.
 */
export async function fetchSupervisorsByDepartmentIds(
  departmentIds: number[],
): Promise<AddEmployeeDepartmentSupervisorRow[]> {
  const uniq = [...new Set(departmentIds.filter((n) => Number.isInteger(n) && n >= 1))].sort(
    (a, b) => a - b,
  )
  if (uniq.length === 0) return []
  /** Plain commas in the URL (URLSearchParams encodes them as %2C). */
  const qs = `departmentIds=${uniq.join(",")}`
  const res = await api.get<ApiResponseDto<unknown>>(`/users/supervisors?${qs}`)
  const data = unwrapSuccess(res, "Failed to load supervisors")
  if (!Array.isArray(data)) return []
  return data.filter(isDepartmentSupervisorRow)
}

/**
 * POST /userdepartmentrole/assign/roles — persist department–role rows for the user (transfer to assigned).
 */
export async function assignUserDepartmentRoles(body: UserDepartmentRoleDepartmentsBody): Promise<void> {
  const res = await api.post<ApiResponseDto<null>>("/userdepartmentrole/assign/roles", body)
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to assign department roles")
  }
}

/**
 * POST /userdepartmentrole/unassign/roles — remove matching active userdepartmentrole rows.
 */
export async function unassignUserDepartmentRoles(body: UserDepartmentRoleDepartmentsBody): Promise<void> {
  const res = await api.post<ApiResponseDto<{ message?: string } | null>>(
    "/userdepartmentrole/unassign/roles",
    body,
  )
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to unassign department roles")
  }
}

export async function assignUserProgramsTs(body: AssignUserProgramsApiBody): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>("/users/new/assign/program", body)
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to assign time study programs")
  }
}

export async function unassignUserProgramsTs(body: AssignUserProgramsApiBody): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>("/users/new/unassign/program", body)
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to unassign time study programs")
  }
}

export async function assignUserActivitiesTs(body: AssignUserActivitiesApiBody): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>("/users/new/assign/activity", body)
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to assign activities")
  }
}

export async function unassignUserActivitiesTs(body: AssignUserActivitiesApiBody): Promise<void> {
  const res = await api.post<ApiResponseDto<unknown>>("/users/new/unassign/activity", body)
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to unassign activities")
  }
}
