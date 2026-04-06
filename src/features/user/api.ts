import { api } from "@/lib/api"

import type {
  ApiResponseDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  GetUserModuleParams,
  UpdateUserRequestDto,
  UserDetailsDto,
  UserListResponseDto,
  UserModuleListResponse,
  UserModuleRow,
} from "./types"

function asUserListResponseDto(payload: ApiResponseDto<UserListResponseDto>): UserListResponseDto {
  if (!payload?.success || !payload.data) {
    throw new Error(payload?.message || "Failed to load users")
  }
  return payload.data
}

function mapUserListItemToRow(item: UserListResponseDto["data"][number]): UserModuleRow {
  const tsMin = item.tsMinPerDay == null ? "" : String(item.tsMinPerDay)
  return {
    id: item.id,
    employee: item.employeeName,
    employeeNo: item.employeeId,
    loginId: item.loginId,
    department: "",
    supervisorPrimary: "",
    supervisorSecondary: "",
    spmp: item.spmp,
    tsMinDay: tsMin,
    programs: false,
    activities: false,
    supervisorApportioning: false,
    clientAdmin: false,
    multicodesEnabled: false,
    assignedMultiCodes: "",
    active: true,
  }
}

export async function apiGetUserModuleRows(params: GetUserModuleParams): Promise<UserModuleListResponse> {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("limit", String(params.pageSize))

  const res = await api.get<ApiResponseDto<UserListResponseDto>>(`/users?${search.toString()}`)
  const dto = asUserListResponseDto(res)

  const items = dto.data.map(mapUserListItemToRow)
  const totalItems = typeof dto.meta?.totalItems === "number" ? dto.meta.totalItems : items.length

  // Backend list currently doesn't support inactiveOnly filtering; apply it client-side for now.
  const filtered = params.inactiveOnly ? items.filter((row) => row.active === false) : items

  return { items: filtered, totalItems: params.inactiveOnly ? filtered.length : totalItems }
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

