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
  AssignUserActivitiesApiBody,
  AssignUserProgramsApiBody,
  SecurityDepartmentRolesQueryResult,
  UserDepartmentRoleDepartmentsBody,
  UserProgramsActivitiesActivityItem,
  UserProgramsActivitiesAssignedPrograms,
  UserProgramsActivitiesAssignedSplit,
  UserProgramsActivitiesDepartmentBundle,
  UserProgramsActivitiesProgramItem,
  UserProgramsActivitiesProgramActivitiesBundle,
  UserProgramsActivitiesProgramActivityGroup,
  UserProgramsActivitiesProgramsBundle,
  UserProgramsActivitiesProgramWithAssignments,
  UserActivitiesOnlyDepartmentBundle,
  UserProgramsOnlyDepartmentBundle,
  UserProgramsOnlyProgram,
  UserProgramsOnlyProgramsBundle,
  UserTimeStudyDepartment,
  UserAllowMultiCodeHistoryRow,
} from "./types"
import { parseSecurityDepartmentRolesResponse } from "./utility/parseSecurityDepartmentRoles"

function unwrapSuccess<T>(res: ApiResponseDto<T>, failureMessage: string): T {
  if (!res?.success) {
    throw new Error(res?.message ?? failureMessage)
  }
  return res.data as T
}

export async function fetchUserAllowMulticodeHistory(userId: string): Promise<UserAllowMultiCodeHistoryRow[]> {
  const res = await api.get<ApiResponseDto<UserAllowMultiCodeHistoryRow[]>>(`/user/allow-multicode-history/${userId}`)
  return unwrapSuccess(res, "Failed to load MultiCodes history")
}

export type RecordUserAllowMultiCodeHistoryPayload = {
  records: {
    userId: string
    departmentId: number
    startDate?: string
    endDate?: string
    allowMultiCodes: boolean
    multiCodeTypes?: string[]
  }[]
}

export async function postUserAllowMulticodeHistory(payload: RecordUserAllowMultiCodeHistoryPayload): Promise<void> {
  const res = await api.post<ApiResponseDto<void>>(`/user/allow-multicode-history/record`, payload)
  unwrapSuccess(res, "Failed to record MultiCodes history")
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
  search.set("limit", "1000")
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
  search.set("limit", "1000")
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
  search.set("limit", "1000")

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
        roleId,
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
  const allPayloads = []
  let page = 1
  const limit = 1000
  const maxPages = 20

  while (page <= maxPages) {
    const search = new URLSearchParams()
    search.set("page", String(page))
    search.set("limit", String(limit))
    search.set("sort", "ASC")
    const uid = options?.userId?.trim()
    if (uid) search.set("userId", uid)

    const res = await api.get<ApiResponseDto<{ data: unknown[]; meta?: { hasNextPage?: boolean } }>>(
      `/departments/user/roles-unassigned?${search.toString()}`,
    )
    const payload = unwrapSuccess(res, "Failed to load unassigned department roles")
    allPayloads.push(payload)
    if (!payload.meta?.hasNextPage) break
    page += 1
  }

  return allPayloads.flatMap(flattenDepartmentsRolesToSecurityItems)
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
          roleId: dr.role?.id,
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
  const idRaw = a.id ?? a.countyActivityId ?? a.county_activity_id
  const id = typeof idRaw === "number" ? idRaw : Number(idRaw)
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

function readProgramJobPoolMeta(raw: Record<string, unknown>): {
  jobpoolId: number | null
  jobpoolName: string | null
} {
  const jobpoolIdRaw = raw.jobpoolId
  const jobpoolId =
    jobpoolIdRaw === null || jobpoolIdRaw === undefined
      ? null
      : typeof jobpoolIdRaw === "number"
        ? jobpoolIdRaw
        : Number(jobpoolIdRaw)
  const jobpoolName = typeof raw.jobpoolName === "string" ? raw.jobpoolName.trim() : null
  return {
    jobpoolId: Number.isFinite(jobpoolId) ? jobpoolId : null,
    jobpoolName: jobpoolName || null,
  }
}

function parseUserProgramsOnlyProgram(raw: unknown, departmentId: number): UserProgramsOnlyProgram | null {
  const program = parseUserProgramsActivitiesProgramItem(raw, departmentId)
  if (!program) return null
  const row = raw as Record<string, unknown>
  return { ...program, ...readProgramJobPoolMeta(row) }
}

function parseUserProgramsOnlyProgramsSplit(
  raw: unknown,
  departmentId: number,
): UserProgramsOnlyProgramsBundle {
  const assigned: UserProgramsOnlyProgramsBundle["assigned"] = { normal: [], jobpoolautoassign: [] }
  const unassigned: UserProgramsOnlyProgram[] = []
  if (raw === null || typeof raw !== "object") {
    return { assigned, unassigned }
  }
  const split = raw as Record<string, unknown>
  const assignedRaw = split.assigned
  if (Array.isArray(assignedRaw)) {
    for (const item of assignedRaw) {
      const parsed = parseUserProgramsOnlyProgram(item, departmentId)
      if (parsed) assigned.normal.push(parsed)
    }
  } else if (assignedRaw !== null && typeof assignedRaw === "object") {
    const buckets = assignedRaw as Record<string, unknown>
    for (const key of ["normal", "jobpoolautoassign"] as const) {
      const list = buckets[key]
      if (!Array.isArray(list)) continue
      for (const item of list) {
        const parsed = parseUserProgramsOnlyProgram(item, departmentId)
        if (parsed) assigned[key].push(parsed)
      }
    }
  }
  if (Array.isArray(split.unassigned)) {
    for (const item of split.unassigned) {
      const parsed = parseUserProgramsOnlyProgram(item, departmentId)
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
  const row = raw as Record<string, unknown>
  const children = parseUserProgramsActivitiesAssignedSplit(row.children, (item) =>
    parseUserProgramsActivitiesActivityItem(item, departmentId),
  )
  return {
    ...program,
    children,
    ...readProgramJobPoolMeta(row),
  }
}

export function parseUserProgramsActivitiesBundle(raw: unknown): UserProgramsActivitiesDepartmentBundle | null {
  if (raw === null || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const departmentId = typeof b.departmentId === "number" ? b.departmentId : Number(b.departmentId)
  const departmentCode = typeof b.departmentCode === "string" ? b.departmentCode : ""
  const departmentName = typeof b.departmentName === "string" ? b.departmentName.trim() : ""
  if (!Number.isFinite(departmentId) || !departmentName) return null

  const programs = parseUserProgramsActivitiesProgramsSplit(b.programs, departmentId)
  const orphanActivities = parseUserProgramsActivitiesAssignedSplit(b.orphanActivities, (item) =>
    parseUserProgramsActivitiesActivityItem(item, departmentId),
  )
  const jobPoolActivities = parseUserProgramsActivitiesAssignedSplit(
    b.jobPoolActivities ?? b.job_pool_activities,
    (item) => parseUserProgramsActivitiesActivityItem(item, departmentId),
  )

  const flags = parseDepartmentFlagsFromBundleRow(b, departmentId, departmentCode, departmentName)
  return {
    ...flags,
    programs,
    orphanActivities,
    jobPoolActivities,
  }
}

function parseUserProgramsActivitiesProgramActivityGroup(
  raw: unknown,
  departmentId: number,
): UserProgramsActivitiesProgramActivityGroup | null {
  if (raw === null || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const programId =
    typeof row.programId === "number" ? row.programId : Number(row.programId ?? row.id)
  const code = typeof row.code === "string" ? row.code : ""
  const name = typeof row.name === "string" ? row.name.trim() : ""
  if (!Number.isFinite(programId) || !name) return null
  const children = parseUserProgramsActivitiesAssignedSplit(row.children, (item) =>
    parseUserProgramsActivitiesActivityItem(item, departmentId),
  )
  const jobpoolIdRaw = row.jobpoolId
  const jobpoolId =
    jobpoolIdRaw === null || jobpoolIdRaw === undefined
      ? null
      : typeof jobpoolIdRaw === "number"
        ? jobpoolIdRaw
        : Number(jobpoolIdRaw)
  const jobpoolName = typeof row.jobpoolName === "string" ? row.jobpoolName.trim() : null
  return {
    programId,
    code,
    name,
    departmentId: Number.isFinite(Number(row.departmentId)) ? Number(row.departmentId) : departmentId,
    children,
    jobpoolId: Number.isFinite(jobpoolId) ? jobpoolId : null,
    jobpoolName: jobpoolName || null,
  }
}

function parseUserProgramsActivitiesProgramActivitiesSplit(
  raw: unknown,
  departmentId: number,
): UserProgramsActivitiesProgramActivitiesBundle {
  const assigned = { normal: [] as UserProgramsActivitiesProgramActivityGroup[], jobpoolautoassign: [] as UserProgramsActivitiesProgramActivityGroup[] }
  const unassigned: UserProgramsActivitiesProgramActivityGroup[] = []
  if (raw === null || typeof raw !== "object") {
    return { assigned, unassigned }
  }
  const split = raw as Record<string, unknown>
  const assignedRaw = split.assigned
  if (assignedRaw !== null && typeof assignedRaw === "object" && !Array.isArray(assignedRaw)) {
    const buckets = assignedRaw as Record<string, unknown>
    for (const key of ["normal", "jobpoolautoassign"] as const) {
      const list = buckets[key]
      if (!Array.isArray(list)) continue
      for (const item of list) {
        const parsed = parseUserProgramsActivitiesProgramActivityGroup(item, departmentId)
        if (parsed) assigned[key].push(parsed)
      }
    }
  }
  if (Array.isArray(split.unassigned)) {
    for (const item of split.unassigned) {
      const parsed = parseUserProgramsActivitiesProgramActivityGroup(item, departmentId)
      if (parsed) unassigned.push(parsed)
    }
  }
  return { assigned, unassigned }
}

function readTsMinPerDay(row: Record<string, unknown>): number | null | undefined {
  const raw = row.tsMinPerDay ?? row.ts_min_per_day ?? row.tsmins
  if (raw === null || raw === undefined) return undefined
  const n = typeof raw === "number" ? raw : Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function parseDepartmentFlagsFromBundleRow(
  b: Record<string, unknown>,
  departmentId: number,
  departmentCode: string,
  departmentName: string,
) {
  const tsMinPerDay = readTsMinPerDay(b)
  return {
    departmentId,
    departmentCode,
    departmentName,
    ...(tsMinPerDay !== undefined ? { tsMinPerDay } : {}),
    moveSaveSubmitToTop: b.moveSaveSubmitToTop === true,
    removeAutoFillEndTime: b.removeAutoFillEndTime === true,
    startorEndTime: b.startorEndTime === true,
    supportingDoc: b.supportingDoc === true,
    removeDescriptionActivityNote: b.removeDescriptionActivityNote === true,
    removeDescriptionActivityNoteAnchor: b.removeDescriptionActivityNoteAnchor === true,
    removeDescriptionActivityNoteMultiCode: b.removeDescriptionActivityNoteMultiCode === true,
  }
}

function parseUserProgramsOnlyBundle(raw: unknown): UserProgramsOnlyDepartmentBundle | null {
  if (raw === null || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const departmentId = typeof b.departmentId === "number" ? b.departmentId : Number(b.departmentId)
  const departmentCode = typeof b.departmentCode === "string" ? b.departmentCode : ""
  const departmentName = typeof b.departmentName === "string" ? b.departmentName.trim() : ""
  const departmentLabel = departmentName || departmentCode.trim()
  if (!Number.isFinite(departmentId) || !departmentLabel) return null
  return {
    ...parseDepartmentFlagsFromBundleRow(b, departmentId, departmentCode, departmentName || departmentLabel),
    programs: parseUserProgramsOnlyProgramsSplit(b.programs, departmentId),
  }
}

function parseUserActivitiesOnlyBundle(raw: unknown): UserActivitiesOnlyDepartmentBundle | null {
  if (raw === null || typeof raw !== "object") return null
  const b = raw as Record<string, unknown>
  const departmentId = typeof b.departmentId === "number" ? b.departmentId : Number(b.departmentId)
  const departmentCode = typeof b.departmentCode === "string" ? b.departmentCode : ""
  const departmentName = typeof b.departmentName === "string" ? b.departmentName.trim() : ""
  const departmentLabel = departmentName || departmentCode.trim()
  if (!Number.isFinite(departmentId) || !departmentLabel) return null

  const programActivities = parseUserProgramsActivitiesProgramActivitiesSplit(
    b.programActivities,
    departmentId,
  )
  const orphanActivities = parseUserProgramsActivitiesAssignedSplit(b.orphanActivities, (item) =>
    parseUserProgramsActivitiesActivityItem(item, departmentId),
  )
  const jobPoolActivities = parseUserProgramsActivitiesAssignedSplit(
    b.jobPoolActivities ?? b.job_pool_activities,
    (item) => parseUserProgramsActivitiesActivityItem(item, departmentId),
  )

  return {
    ...parseDepartmentFlagsFromBundleRow(b, departmentId, departmentCode, departmentName || departmentLabel),
    programActivities,
    orphanActivities,
    jobPoolActivities,
  }
}

function programActivityGroupToProgramWithAssignments(
  group: UserProgramsActivitiesProgramActivityGroup,
  p: UserProgramsOnlyProgram,
): UserProgramsActivitiesProgramWithAssignments {
  return {
    ...p,
    children: group.children,
    jobpoolId: group.jobpoolId ?? p.jobpoolId ?? null,
    jobpoolName: group.jobpoolName ?? p.jobpoolName ?? null,
  }
}

const EMPTY_ACTIVITY_SPLIT: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem> = {
  assigned: [],
  unassigned: [],
}

function programOnlyToWithAssignments(
  program: UserProgramsOnlyProgram,
  children: UserProgramsActivitiesAssignedSplit<UserProgramsActivitiesActivityItem> = EMPTY_ACTIVITY_SPLIT,
): UserProgramsActivitiesProgramWithAssignments {
  return {
    ...program,
    children,
    jobpoolId: program.jobpoolId ?? null,
    jobpoolName: program.jobpoolName ?? null,
  }
}

function attachProgramActivitiesToProgramsBundle(
  programsOnly: UserProgramsOnlyDepartmentBundle,
  activitiesOnly: UserActivitiesOnlyDepartmentBundle,
): UserProgramsActivitiesDepartmentBundle {
  const mapGroups = (
    programs: UserProgramsOnlyProgram[],
    groups: UserProgramsActivitiesProgramActivityGroup[],
  ): UserProgramsActivitiesProgramWithAssignments[] =>
    programs.map((p) => {
      const group = groups.find((g) => g.programId === p.id)
      return group
        ? programActivityGroupToProgramWithAssignments(group, p)
        : programOnlyToWithAssignments(p)
    })

  return {
    ...programsOnly,
    programs: {
      assigned: {
        normal: mapGroups(
          programsOnly.programs.assigned.normal,
          activitiesOnly.programActivities.assigned.normal,
        ),
        jobpoolautoassign: mapGroups(
          programsOnly.programs.assigned.jobpoolautoassign,
          activitiesOnly.programActivities.assigned.jobpoolautoassign,
        ),
      },
      unassigned: mapGroups(
        programsOnly.programs.unassigned,
        activitiesOnly.programActivities.unassigned,
      ),
    },
    orphanActivities: activitiesOnly.orphanActivities,
    jobPoolActivities: activitiesOnly.jobPoolActivities,
  }
}

function mergeProgramsAndActivitiesBundleLists(
  programsList: UserProgramsOnlyDepartmentBundle[],
  activitiesList: UserActivitiesOnlyDepartmentBundle[],
): UserProgramsActivitiesDepartmentBundle[] {
  const activitiesByDept = new Map(activitiesList.map((b) => [b.departmentId, b]))
  return programsList.map((programsOnly) => {
    const activitiesOnly = activitiesByDept.get(programsOnly.departmentId)
    if (!activitiesOnly) {
      return {
        ...programsOnly,
        programs: {
          assigned: {
            normal: programsOnly.programs.assigned.normal.map((p) => programOnlyToWithAssignments(p)),
            jobpoolautoassign: programsOnly.programs.assigned.jobpoolautoassign.map((p) => programOnlyToWithAssignments(p)),
          },
          unassigned: programsOnly.programs.unassigned.map((p) => programOnlyToWithAssignments(p)),
        },
        orphanActivities: { assigned: [], unassigned: [] },
        jobPoolActivities: { assigned: [], unassigned: [] },
      }
    }
    return attachProgramActivitiesToProgramsBundle(programsOnly, activitiesOnly)
  })
}

export type UserDepartmentsScope = "security" | "timestudy"

function parseUserTimeStudyDepartment(raw: unknown): UserTimeStudyDepartment | null {
  if (raw === null || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const departmentId = typeof row.departmentId === "number" ? row.departmentId : Number(row.departmentId)
  const departmentCode = typeof row.departmentCode === "string" ? row.departmentCode : ""
  const departmentName = typeof row.departmentName === "string" ? row.departmentName.trim() : ""
  if (!Number.isFinite(departmentId) || departmentId < 1 || !departmentName) return null
  const tsMinPerDay = readTsMinPerDay(row)
  const allowActivationStartDateAndEndDate = typeof row.allowActivationStartDateAndEndDate === "boolean" ? row.allowActivationStartDateAndEndDate : undefined
  const multiCodes = Array.isArray(row.multiCodes) ? row.multiCodes.map(String) : undefined

  return {
    departmentId,
    departmentCode,
    departmentName,
    ...(tsMinPerDay !== null ? { tsMinPerDay } : {}),
    ...(allowActivationStartDateAndEndDate !== undefined ? { allowActivationStartDateAndEndDate } : {}),
    ...(multiCodes !== undefined ? { multiCodes } : {}),
    moveSaveSubmitToTop: row.moveSaveSubmitToTop === true,
    removeAutoFillEndTime: row.removeAutoFillEndTime === true,
    startorEndTime: row.startorEndTime === true,
    supportingDoc: row.supportingDoc === true,
    removeDescriptionActivityNote: row.removeDescriptionActivityNote === true,
    removeDescriptionActivityNoteAnchor: row.removeDescriptionActivityNoteAnchor === true,
    removeDescriptionActivityNoteMultiCode: row.removeDescriptionActivityNoteMultiCode === true,
  }
}

/** GET …/user/departments?userId=… — departments mapped to the user. */
export async function fetchUserTimeStudyDepartments(
  userId: string,
  scope: UserDepartmentsScope = "timestudy",
  departmentId?: number,
): Promise<UserTimeStudyDepartment[]> {
  const uid = userId.trim()
  if (!uid) throw new Error("userId is required")
  const search = new URLSearchParams()
  search.set("userId", uid)
  search.set("scope", scope)
  if (departmentId != null && Number.isFinite(departmentId) && departmentId >= 1) {
    search.set("departmentId", String(departmentId))
  }
  const res = await api.get<ApiResponseDto<unknown>>(
    `/timestudyprogram/user/departments?${search.toString()}`,
  )
  const payload = unwrapSuccess(res, "Failed to load user departments")
  const list = Array.isArray(payload) ? payload : []
  const out: UserTimeStudyDepartment[] = []
  for (const row of list) {
    const parsed = parseUserTimeStudyDepartment(row)
    if (parsed) out.push(parsed)
  }
  return out
}

export function userTimeStudyDepartmentToBundleStub(
  dept: UserTimeStudyDepartment,
): UserProgramsActivitiesDepartmentBundle {
  return {
    departmentId: dept.departmentId,
    departmentCode: dept.departmentCode,
    departmentName: dept.departmentName,
    ...(dept.tsMinPerDay !== undefined ? { tsMinPerDay: dept.tsMinPerDay } : {}),
    programs: {
      assigned: { normal: [], jobpoolautoassign: [] },
      unassigned: [],
    },
    orphanActivities: { assigned: [], unassigned: [] },
    jobPoolActivities: { assigned: [], unassigned: [] },
  }
}

async function fetchUserProgramsActivitiesSplit(
  userId: string,
  path: "programs-with-assignments" | "activities-with-assignments",
  departmentId?: number,
): Promise<unknown[]> {
  const uid = userId.trim()
  if (!uid) throw new Error("userId is required")
  const search = new URLSearchParams()
  search.set("userId", uid)
  if (departmentId != null && Number.isFinite(departmentId) && departmentId >= 1) {
    search.set("departmentId", String(departmentId))
  }
  const res = await api.get<ApiResponseDto<unknown>>(
    `/timestudyprogram/user/${path}?${search.toString()}`,
  )
  const payload = unwrapSuccess(res, `Failed to load user ${path}`)
  return Array.isArray(payload) ? payload : []
}

/** GET …/user/programs-with-assignments — programs only (no nested activity children). */
export async function fetchUserProgramsWithAssignments(
  userId: string,
  departmentId?: number,
): Promise<UserProgramsOnlyDepartmentBundle[]> {
  const list = await fetchUserProgramsActivitiesSplit(userId, "programs-with-assignments", departmentId)
  const out: UserProgramsOnlyDepartmentBundle[] = []
  for (const row of list) {
    const bundle = parseUserProgramsOnlyBundle(row)
    if (bundle) out.push(bundle)
  }
  if (departmentId != null && Number.isFinite(departmentId) && departmentId >= 1) {
    return out.filter((b) => Number(b.departmentId) === departmentId)
  }
  return out
}

/** GET …/user/activities-with-assignments — programActivities, orphanActivities, jobPoolActivities. */
export async function fetchUserActivitiesWithAssignments(
  userId: string,
  departmentId?: number,
): Promise<UserActivitiesOnlyDepartmentBundle[]> {
  const list = await fetchUserProgramsActivitiesSplit(userId, "activities-with-assignments", departmentId)
  const out: UserActivitiesOnlyDepartmentBundle[] = []
  for (const row of list) {
    const bundle = parseUserActivitiesOnlyBundle(row)
    if (bundle) out.push(bundle)
  }
  if (departmentId != null && Number.isFinite(departmentId) && departmentId >= 1) {
    return out.filter((b) => Number(b.departmentId) === departmentId)
  }
  return out
}

/**
 * Time Study tab: parallel programs + activities split endpoints, merged by departmentId.
 * Attaches per-program activity children from `programActivities` (not legacy transfer trees).
 */
export async function fetchUserProgramsAndActivities(
  userId: string,
  departmentId?: number,
): Promise<UserProgramsActivitiesDepartmentBundle[]> {
  const [programsList, activitiesList] = await Promise.all([
    fetchUserProgramsWithAssignments(userId, departmentId),
    fetchUserActivitiesWithAssignments(userId, departmentId),
  ])
  return mergeProgramsAndActivitiesBundleLists(programsList, activitiesList)
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

/** @deprecated Use fetchSecurityDepartmentRoles */
export async function fetchDepartmentRolesForUser(
  userId: string,
): Promise<SecurityDepartmentRolesQueryResult> {
  return fetchSecurityDepartmentRoles(userId)
}
