import { api } from "@/lib/api"

import type {
  ApiResponseDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  GetUserModuleParams,
  UpdateUserRequestDto,
  UserDetailsDto,
  UserListItemApiDto,
  UserListResponseDto,
  UserModuleListResponse,
  UserModuleRow,
} from "./types"



/** Department rows with `roles: { id?, name }[]` (assigned / unassigned list payloads). */
function getDepartmentRowsWithRolesFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload !== null && typeof payload === "object") {
    const p = payload as Record<string, unknown>
    if (Array.isArray(p.data)) return p.data
    if (p.success === true && p.data !== null && typeof p.data === "object") {
      const inner = p.data as Record<string, unknown>
      if (Array.isArray(inner.data)) return inner.data
    }
  }
  return []
}

/** Role display names from nested department → roles (deduplicated). */
export function extractRoleNamesFromDepartmentsWithRolesPayload(payload: unknown): string[] {
  const names = new Set<string>()
  for (const raw of getDepartmentRowsWithRolesFromPayload(payload)) {
    if (raw === null || typeof raw !== "object") continue
    const roles = (raw as Record<string, unknown>).roles
    if (!Array.isArray(roles)) continue
    for (const r of roles) {
      if (r === null || typeof r !== "object") continue
      const nm = (r as Record<string, unknown>).name
      const name = typeof nm === "string" ? nm.trim() : ""
      if (name) names.add(name)
    }
  }
  return Array.from(names)
}

/**
 * GET /departments/user/roles-assigned-for-user?userId=
 * Canonical assigned role names for the user (department-role assignments).
 */
export async function apiGetRolesAssignedForUser(userId: string): Promise<string[]> {
  const search = new URLSearchParams()
  search.set("userId", userId.trim())
  const res = await api.get<ApiResponseDto<unknown>>(
    `/departments/user/roles-assigned-for-user?${search.toString()}`,
  )
  if (!res?.success || res.data == null) {
    throw new Error(res?.message ?? "Failed to load assigned department roles")
  }
  return extractRoleNamesFromDepartmentsWithRolesPayload(res.data)
}

function asUserListResponseDto(payload: ApiResponseDto<UserListResponseDto>): UserListResponseDto {
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.message || "Failed to load users")
  }
  // Handle case where data is directly an array (old format) or an object with data property (new format)
  const rawData = payload.data as any
  if (Array.isArray(rawData)) {
    return { data: rawData, meta: { totalItems: rawData.length, itemCount: rawData.length, itemsPerPage: rawData.length, totalPages: 1, currentPage: 1 } }
  }
  if (rawData.data && Array.isArray(rawData.data)) {
    return rawData
  }
  return { data: [], meta: { totalItems: 0, itemCount: 0, itemsPerPage: 10, totalPages: 0, currentPage: 1 } }
}

function listItemDepartmentLabel(departments: UserListItemApiDto["departments"] | undefined): string {
  const rows = departments ?? []
  if (rows.length === 0) return ""
  return rows.map((d) => d.name).join(", ")
}

function listItemRoleAssignments(
  departmentsRoles: UserListItemApiDto["departmentsRoles"] | undefined,
  roles: UserListItemApiDto["roles"] | undefined,
): string[] {
  const fromDr = new Set<string>()
  for (const row of departmentsRoles ?? []) {
    const n = row.role?.name?.trim()
    if (n) fromDr.add(n)
  }
  if (fromDr.size > 0) {
    return [...fromDr].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  }
  const fromRoles = new Set<string>()
  for (const r of roles ?? []) {
    const n = r.name?.trim()
    if (n) fromRoles.add(n)
  }
  return [...fromRoles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

function listItemSupervisorApportioning(
  departmentsRoles: UserListItemApiDto["departmentsRoles"] | undefined,
): boolean {
  return (departmentsRoles ?? []).some((r) => r.apportioningRequired === true)
}

/** Maps GET /users list items to table rows; ignores contacts, documents, addresses, etc. */
function mapUserListItemToRow(item: UserListItemApiDto): UserModuleRow {
  const loginId = item.user?.loginId?.trim() ?? ""
  const displayName =
    (item.name ?? "").trim() ||
    `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
    loginId
  const tsMin = item.tsmins == null ? "" : String(item.tsmins)
  const multi = item.multiCodes ?? []
  const assignedMultiCodes = Array.isArray(multi)
    ? multi.filter((x): x is string => typeof x === "string" && x.trim().length > 0).join(", ")
    : ""

  const assignedMultiCodesDetailed: Array<{ departmentName: string; codes: string }> = []
  const deptMultiCodeParts: string[] = []
  if (Array.isArray(item.userMultiCode) && item.userMultiCode.length > 0) {
    for (const dmc of item.userMultiCode) {
      if (Array.isArray(dmc.multiCodes) && dmc.multiCodes.length > 0) {
        const codesStr = dmc.multiCodes.filter((x): x is string => typeof x === "string" && x.trim().length > 0).join(", ")
        if (codesStr) {
          const matchedDept = item.departments?.find(d => d.id === dmc.departmentId)
          const deptRaw = matchedDept?.code?.trim() || dmc.departmentName?.trim() || matchedDept?.name?.trim() || `Dept ${dmc.departmentId}`
          const deptDisplay = deptRaw.split("-")[0].trim()
          deptMultiCodeParts.push(`${deptDisplay}: ${codesStr}`)
          assignedMultiCodesDetailed.push({ departmentName: deptDisplay, codes: codesStr })
        }
      }
    }
  } else if (Array.isArray(item.departments)) {
    for (const dept of item.departments) {
      if (Array.isArray(dept.multiCodes) && dept.multiCodes.length > 0) {
        const codesStr = dept.multiCodes.filter((x): x is string => typeof x === "string" && x.trim().length > 0).join(", ")
        if (codesStr) {
          const deptRaw = dept.code?.trim() || dept.name?.trim() || `Dept ${dept.id}`
          const deptDisplay = deptRaw.split("-")[0].trim()
          deptMultiCodeParts.push(`${deptDisplay}: ${codesStr}`)
          assignedMultiCodesDetailed.push({ departmentName: deptDisplay, codes: codesStr })
        }
      }
    }
  }

  const assignedMultiCodesDisplay = deptMultiCodeParts.length > 0
    ? deptMultiCodeParts.join("; ")
    : undefined

  return {
    id: item.id,
    employee: displayName,
    employeeNo: item.employeeId ?? undefined,
    positionNo: item.positionName ?? undefined,
    location: item.location?.name ?? undefined,
    firstName: item.firstName,
    lastName: item.lastName,
    loginId: loginId || undefined,
    emailAddress: loginId || undefined,
    claimingUnit: item.claimingUnit ?? undefined,
    department: listItemDepartmentLabel(item.departments),
    roleAssignments: listItemRoleAssignments(item.departmentsRoles, item.roles),
    supervisorPrimary: item.primarySupervisor?.name ?? "",
    supervisorSecondary: item.backupSupervisor?.name ?? "",
    supervisorPrimaryId: item.primarySupervisor?.id,
    supervisorSecondaryId: item.backupSupervisor?.id,
    spmp: item.spmp ?? false,
    tsMinDay: tsMin,
    programs: false,
    activities: false,
    supervisorApportioning: listItemSupervisorApportioning(item.departmentsRoles),
    clientAdmin: false,
    multicodesEnabled: item.allowMultiCodes ?? false,
    allowMultiCodes: item.allowMultiCodes ?? false,
    assignedMultiCodes,
    assignedMultiCodesDisplay,
    assignedMultiCodesDetailed,
    active: true,
  }
}

export async function apiGetUserModuleRows(params: GetUserModuleParams): Promise<UserModuleListResponse> {
  const listActive = !params.inactiveOnly

  if (params.isSupervisor) {
    const search = new URLSearchParams()
    search.set("page", String(params.page))
    search.set("limit", String(params.pageSize))
    search.set("sort", params.sort ?? "ASC")
    if (params.sortBy !== undefined) {
      search.set("sortBy", params.sortBy)
    }
    search.set("status", params.inactiveOnly ? "inactive" : "active")
    if (params.departmentId !== undefined) {
      search.set("departmentId", String(params.departmentId))
    }
    const queryString = search.toString()
    const eligibleRes = await api.get<ApiResponseDto<UserListResponseDto>>(`/timestudyrecords/users/eligible?${queryString}`)
    const dto = asUserListResponseDto(eligibleRes)
    
    const items = dto.data.map((item: UserListItemApiDto) => ({
      ...mapUserListItemToRow(item),
      active: listActive,
    }))
    const totalItems = typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : items.length

    return { items, totalItems }
  }

  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("limit", String(params.pageSize))
  search.set("sort", params.sort ?? "ASC")
  if (params.sortBy !== undefined) {
    search.set("sortBy", params.sortBy)
  }
  /** Backend `UserListQueryDto.status` — matches `UserStatus` enum strings. */
  search.set("status", params.inactiveOnly ? "inactive" : "active")
  const firstName = (params.firstName ?? "").trim()
  const lastName = (params.lastName ?? "").trim()
  const nameParam = (params.name ?? "").trim()
  const employeeId = (params.employeeId ?? "").trim()
  if (firstName) search.set("firstName", firstName)
  if (lastName) search.set("lastName", lastName)
  if (nameParam) search.set("name", nameParam)
  if (employeeId) search.set("employeeId", employeeId)
  if (params.departmentId !== undefined) search.set("departmentId", String(params.departmentId))

  const queryString = search.toString().replace(/%2C/g, ",")
  const res = await api.get<ApiResponseDto<UserListResponseDto>>(`/users?${queryString}`)
  const dto = asUserListResponseDto(res)

  const items = dto.data.map((item) => ({
    ...mapUserListItemToRow(item),
    active: listActive,
  }))
  const totalItems = typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : items.length

  return { items, totalItems }
}

/**
 * GET /users — total row count with no `status` filter (`page=1`, `limit=1`).
 * Dashboard “Users” total (all users).
 */
export async function getUsersTotalCountUnfiltered(): Promise<number> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "1")
  search.set("sort", "ASC")
  const res = await api.get<ApiResponseDto<UserListResponseDto>>(`/users?${search.toString()}`)
  const dto = asUserListResponseDto(res)
  return typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : dto.data.length
}

/**
 * GET /users — total row count for one `status` (`page=1`, `limit=1`).
 * Dashboard “Active users” uses `active` only.
 */
export async function getUsersTotalCountByStatus(status: "active" | "inactive"): Promise<number> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "1")
  search.set("sort", "ASC")
  search.set("status", status)
  const res = await api.get<ApiResponseDto<UserListResponseDto>>(`/users?${search.toString()}`)
  const dto = asUserListResponseDto(res)
  return typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : dto.data.length
}

/**
 * Creates Tab 1 employee/login record. Legacy UAT used `POST .../user/direct`; v2 uses `POST /users`.
 */
export async function apiCreateUser(input: CreateUserRequestDto): Promise<CreateUserResponseDto> {
  const res = await api.post<ApiResponseDto<CreateUserResponseDto>>("/users", input)
  if (!res?.success || !res.data) throw new Error(res?.message || "Failed to create user")
  return res.data
}

export async function apiUpdateUser(id: string, input: UpdateUserRequestDto): Promise<CreateUserResponseDto> {
  const res = await api.put<ApiResponseDto<CreateUserResponseDto>>(`/users/${encodeURIComponent(id)}`, input)
  if (!res?.success || !res.data) throw new Error(res?.message || "Failed to update user")
  return res.data
}

/**
 * PUT /users/:id/reset — resets the user's password to the system default (`Password1-2`)
 * and sets `changePasswordRequired = true`. Other profile fields in `input` are also persisted.
 */
export async function apiResetUser(id: string, input: UpdateUserRequestDto): Promise<CreateUserResponseDto> {
  const res = await api.put<ApiResponseDto<CreateUserResponseDto>>(`/users/${encodeURIComponent(id)}/reset`, input)
  if (!res?.success || !res.data) throw new Error(res?.message || "Failed to reset user password")
  return res.data
}

export async function apiGetUserDetails(userId: string): Promise<UserDetailsDto> {
  const res = await api.get<ApiResponseDto<UserDetailsDto>>(
    `/users/${encodeURIComponent(userId)}/details`
  )
  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to load user details")
  }
  return res.data
}

