import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

import type {
  AddEmployeeActivityDepartmentRow,
  AddEmployeeDepartmentRolesListPayload,
  AddEmployeeJobClassificationListPayload,
  AddEmployeeJobClassificationRow,
  AddEmployeeLocationListPayload,
  AddEmployeeLocationRow,
  AddEmployeeMasterCodeListPayload,
  AddEmployeeMasterCodeRow,
  AddEmployeeSecurityRoleCatalogItem,
  AssignUserActivitiesApiBody,
  AssignUserProgramsApiBody,
  SecurityDepartmentRolesQueryResult,
  UserDepartmentRoleDepartmentsBody,
  UserProgramsActivitiesActivityItem,
  UserProgramsActivitiesAssignedPrograms,
  UserProgramsActivitiesAssignedSplit,
  UserProgramsActivitiesDepartmentBundle,
  UserProgramsActivitiesProgramItem,
  UserProgramsActivitiesProgramsBundle,
  UserProgramsActivitiesProgramWithAssignments,
} from "./types"
import { parseSecurityDepartmentRolesResponse } from "./utility/parseSecurityDepartmentRoles"

function unwrapSuccess<T>(res: ApiResponseDto<T>, failureMessage: string): T {
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? failureMessage)
  }
  return res.data
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
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<AddEmployeeLocationListPayload | AddEmployeeLocationRow[]>>(
    `/location/all?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load locations")
  return normalizeLocationListRows(payload).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  )
}

export async function fetchAddEmployeeJobClassifications(): Promise<AddEmployeeJobClassificationRow[]> {
  const search = new URLSearchParams()
  search.set("status", "active")

  const res = await api.get<ApiResponseDto<AddEmployeeJobClassificationListPayload | AddEmployeeJobClassificationRow[]>>(
    `/jobclassification/all?${search.toString()}`
  )
  const payload = unwrapSuccess(res, "Failed to load job classifications") as any
  return Array.isArray(payload) ? payload : payload.data
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

export async function fetchDepartmentRolesCatalog(): Promise<AddEmployeeSecurityRoleCatalogItem[]> {
  const out: AddEmployeeSecurityRoleCatalogItem[] = []
  let page = 1
  const limit = 1000
  const maxPages = 20

  while (page <= maxPages) {
    const search = new URLSearchParams()
    search.set("page", String(page))
    search.set("limit", String(limit))
    search.set("status", "active")

    const res = await api.get<ApiResponseDto<AddEmployeeDepartmentRolesListPayload>>(
      `/department-roles?${search.toString()}`
    )
    const payload = unwrapSuccess(res, "Failed to load department roles")

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

    if (!payload.meta?.hasNextPage) break
    page += 1
  }

  return out
}

function parseUserProgramsActivitiesActivityItem(
  raw: unknown,
  fallbackDepartmentId: number,
): UserProgramsActivitiesActivityItem | null {
  if (raw === null || typeof raw !== "object") return null
  const a = raw as Record<string, unknown>
  const id = typeof a.id === "number" ? a.id : Number(a.id)
  const name = typeof a.name === "string" ? a.name.trim() : ""
  if (!Number.isFinite(id) || !name) return null
  const code = typeof a.code === "string" ? a.code : ""
  const aid = typeof a.departmentId === "number" ? a.departmentId : Number(a.departmentId)
  return {
    id,
    code,
    name,
    departmentId: Number.isFinite(aid) ? aid : fallbackDepartmentId,
  }
}

function parseUserProgramsActivitiesProgramItem(
  raw: unknown,
  fallbackDepartmentId: number,
): UserProgramsActivitiesProgramItem | null {
  if (raw === null || typeof raw !== "object") return null
  const p = raw as Record<string, unknown>
  const id = typeof p.id === "number" ? p.id : Number(p.id)
  const name = typeof p.name === "string" ? p.name.trim() : ""
  if (!Number.isFinite(id) || !name) return null
  const code = typeof p.code === "string" ? p.code : ""
  const pid = typeof p.departmentId === "number" ? p.departmentId : Number(p.departmentId)
  const parentIdRaw = p.parentId
  const parentId =
    parentIdRaw === null || parentIdRaw === undefined
      ? null
      : typeof parentIdRaw === "number"
        ? parentIdRaw
        : Number(parentIdRaw)
  const status = typeof p.status === "string" ? p.status : undefined
  const type = typeof p.type === "string" ? p.type : undefined
  return {
    id,
    code,
    name,
    departmentId: Number.isFinite(pid) ? pid : fallbackDepartmentId,
    status,
    type,
    parentId: Number.isFinite(parentId) ? parentId : parentId === null ? null : undefined,
    isMultiCode: p.isMultiCode === true,
  }
}

function parseUserProgramsActivitiesAssignedSplit<T>(
  raw: unknown,
  parseItem: (item: unknown) => T | null,
): UserProgramsActivitiesAssignedSplit<T> {
  const assigned: T[] = []
  const unassigned: T[] = []
  if (raw == null) {
    return { assigned, unassigned }
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const parsed = parseItem(item)
      if (parsed) assigned.push(parsed)
    }
    return { assigned, unassigned }
  }
  if (typeof raw !== "object") {
    return { assigned, unassigned }
  }
  const split = raw as Record<string, unknown>
  if (Array.isArray(split.assigned)) {
    for (const item of split.assigned) {
      const parsed = parseItem(item)
      if (parsed) assigned.push(parsed)
    }
  }
  if (Array.isArray(split.unassigned)) {
    for (const item of split.unassigned) {
      const parsed = parseItem(item)
      if (parsed) unassigned.push(parsed)
    }
  }
  return { assigned, unassigned }
}

/** Programs split: `assigned` is `{ normal, jobpoolautoassign }` or a legacy array. */
function parseUserProgramsActivitiesProgramsSplit(
  raw: unknown,
  departmentId: number,
): UserProgramsActivitiesProgramsBundle {
  const assigned: UserProgramsActivitiesAssignedPrograms = { normal: [], jobpoolautoassign: [] }
  const unassigned: UserProgramsActivitiesProgramWithAssignments[] = []
  if (raw === null || typeof raw !== "object") {
    return { assigned, unassigned }
  }
  const split = raw as Record<string, unknown>
  const assignedRaw = split.assigned
  if (Array.isArray(assignedRaw)) {
    for (const item of assignedRaw) {
      const parsed = parseUserProgramsActivitiesProgramWithAssignments(item, departmentId)
      if (parsed) assigned.normal.push(parsed)
    }
  } else if (assignedRaw !== null && typeof assignedRaw === "object") {
    const buckets = assignedRaw as Record<string, unknown>
    for (const key of ["normal", "jobpoolautoassign"] as const) {
      const list = buckets[key]
      if (!Array.isArray(list)) continue
      for (const item of list) {
        const parsed = parseUserProgramsActivitiesProgramWithAssignments(item, departmentId)
        if (parsed) assigned[key].push(parsed)
      }
    }
  }
  if (Array.isArray(split.unassigned)) {
    for (const item of split.unassigned) {
      const parsed = parseUserProgramsActivitiesProgramWithAssignments(item, departmentId)
      if (parsed) unassigned.push(parsed)
    }
  }
  return { assigned, unassigned }
}

function parseUserProgramsActivitiesProgramWithAssignments(
  raw: unknown,
  departmentId: number,
): UserProgramsActivitiesProgramWithAssignments | null {
  const program = parseUserProgramsActivitiesProgramItem(raw, departmentId)
  if (!program) return null
  const childrenRaw =
    raw !== null && typeof raw === "object"
      ? (raw as Record<string, unknown>).children
      : undefined
  const children = parseUserProgramsActivitiesAssignedSplit(childrenRaw, (item) =>
    parseUserProgramsActivitiesActivityItem(item, departmentId),
  )
  return { ...program, children }
}

function parseUserProgramsActivitiesBundle(raw: unknown): UserProgramsActivitiesDepartmentBundle | null {
  if (raw === null || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const departmentId = typeof b.departmentId === "number" ? b.departmentId : Number(b.departmentId)
  const departmentCode = typeof b.departmentCode === "string" ? b.departmentCode : ""
  const departmentName = typeof b.departmentName === "string" ? b.departmentName.trim() : ""
  if (!Number.isFinite(departmentId) || !departmentName) return null

  const programs = parseUserProgramsActivitiesProgramsSplit(b.programs, departmentId)

  return {
    departmentId,
    departmentCode,
    departmentName,
    moveSaveSubmitToTop: b.moveSaveSubmitToTop === true,
    removeAutoFillEndTime: b.removeAutoFillEndTime === true,
    startorEndTime: b.startorEndTime === true,
    supportingDoc: b.supportingDoc === true,
    removeDescriptionActivityNote: b.removeDescriptionActivityNote === true,
    removeDescriptionActivityNoteAnchor: b.removeDescriptionActivityNoteAnchor === true,
    removeDescriptionActivityNoteMultiCode: b.removeDescriptionActivityNoteMultiCode === true,
    programs,
  }
}

/**
 * GET /timestudyprogram/user/programs-activities-with-assignments
 * Omit `departmentId` to list departments in scope; pass `departmentId` to load one department’s programs.
 */
export async function fetchUserProgramsAndActivities(
  userId: string,
  departmentId?: number,
): Promise<UserProgramsActivitiesDepartmentBundle[]> {
  const uid = userId.trim()
  if (!uid) {
    throw new Error("userId is required")
  }
  const search = new URLSearchParams()
  search.set("userId", uid)
  if (departmentId != null && Number.isFinite(departmentId) && departmentId >= 1) {
    search.set("departmentId", String(departmentId))
  }
  const res = await api.get<ApiResponseDto<unknown>>(
    `/timestudyprogram/user/programs-activities-with-assignments?${search.toString()}`,
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
  const res = await api.get<ApiResponseDto<AddEmployeeMasterCodeListPayload | AddEmployeeMasterCodeRow[]>>(
    `/master-codes/all`
  )
  const payload = unwrapSuccess(res, "Failed to load master codes") as any
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : [])
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

/**
 * Uploads a user document (Job Duty Statement, Profile Photo, etc.).
 */
export async function apiUploadUserDocument(userId: string, docType: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("userId", userId)
  formData.append("docType", docType)

  const res = await api.post<ApiResponseDto<any>>("/user-documents/upload", formData)
  return unwrapSuccess(res, "Failed to upload document")
}

export async function fetchUserDetailsTab(userId: string, method: string): Promise<Record<string, unknown>> {
  const res = await api.get<ApiResponseDto<Record<string, unknown>>>(`/users/${userId}/details/required?method=${method}`)
  return unwrapSuccess(res, `Failed to load user details for ${method}`)
}

export async function fetchSecurityDepartmentRoles(
  userId: string,
): Promise<SecurityDepartmentRolesQueryResult> {
  const search = new URLSearchParams()
  search.set("userId", userId.trim())
  search.set("sort", "ASC")
  const res = await api.get<ApiResponseDto<unknown>>(
    `/departments/assignedDepartment/roles?${search.toString()}`,
  )
  const payload = unwrapSuccess(res, "Failed to load department roles for user")
  return parseSecurityDepartmentRolesResponse(payload)
}
