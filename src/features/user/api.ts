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
    active: true,
  }
}

export async function apiGetUserModuleRows(params: GetUserModuleParams): Promise<UserModuleListResponse> {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("limit", String(params.pageSize))
  search.set("sort", params.sort ?? "ASC")
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

  const listActive = !params.inactiveOnly
  const items = dto.data.map((item) => ({
    ...mapUserListItemToRow(item),
    active: listActive,
  }))
  const totalItems = typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : items.length

  return { items, totalItems }
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

export async function apiGetUserDetails(userId: string): Promise<UserDetailsDto> {
  const res = await api.get<ApiResponseDto<UserDetailsDto>>(
    `/users/${encodeURIComponent(userId)}/details`
  )
  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to load user details")
  }
  return res.data
}

