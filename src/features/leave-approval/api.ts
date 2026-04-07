import { api } from "@/lib/api"

import type {
  ApiEnvelopeDto,
  ApiResponseDto,
  CreateUserLeaveRequestDto,
  GetUserLeavesParams,
  ReviewUserLeaveRequestDto,
  SubmitUserLeaveRequestDto,
  UserLeave,
  UserLeaveDetailsResponseDto,
  UserLeaveListItemDto,
  UserLeaveListResponseAlternateDto,
  UserLeaveListResponseDto,
  UserLeaveListResponseLegacyDto,
} from "./types"

function ensureSuccess<T>(
  res: ApiResponseDto<T> | ApiEnvelopeDto<T> | undefined,
  fallbackMessage: string,
): T {
  if (!res) throw new Error(fallbackMessage)

  if ("statusCode" in res) {
    if (typeof res.statusCode === "number" && res.statusCode !== 0) {
      throw new Error(res.message || fallbackMessage)
    }
    return res.data
  }

  if (!res.success || res.data == null) {
    throw new Error(res.message || fallbackMessage)
  }
  return res.data
}

/** Backend list is `UserLeaveListResponseDto` (`items` + `meta`). Legacy payloads used `data` + `meta`. */
export function normalizeUserLeaveListPayload(
  payload:
    | UserLeaveListResponseDto
    | UserLeaveListResponseLegacyDto
    | UserLeaveListResponseAlternateDto,
): { rows: UserLeaveListItemDto[]; meta: UserLeaveListResponseDto["meta"] } {
  if ("items" in payload && Array.isArray(payload.items)) {
    return { rows: payload.items, meta: payload.meta }
  }
  if ("data" in payload && Array.isArray(payload.data)) {
    return { rows: payload.data, meta: payload.meta }
  }
  throw new Error("Invalid user leave list payload")
}

export async function apiCreateUserLeave(input: CreateUserLeaveRequestDto): Promise<UserLeave> {
  const res = await api.post<ApiResponseDto<UserLeave> | ApiEnvelopeDto<UserLeave>>(
    "/usersleave/create",
    input,
  )
  return ensureSuccess(res, "Failed to create leave request")
}

export async function apiUpdateUserLeave(id: number, input: CreateUserLeaveRequestDto): Promise<UserLeave> {
  const res = await api.put<ApiResponseDto<UserLeave> | ApiEnvelopeDto<UserLeave>>(
    `/usersleave/${id}`,
    input,
  )
  return ensureSuccess(res, "Failed to update leave request")
}

export async function apiSubmitUserLeaveAction(
  id: number,
  input: SubmitUserLeaveRequestDto,
): Promise<UserLeave> {
  const res = await api.post<ApiResponseDto<UserLeave> | ApiEnvelopeDto<UserLeave>>(
    `/usersleave/submit/${id}`,
    input,
  )
  return ensureSuccess(res, "Failed to submit leave action")
}

export async function apiReviewUserLeave(id: number, input: ReviewUserLeaveRequestDto): Promise<UserLeave> {
  const res = await api.post<ApiResponseDto<UserLeave> | ApiEnvelopeDto<UserLeave>>(
    `/usersleave/${id}/review`,
    input,
  )
  return ensureSuccess(res, "Failed to review leave request")
}

export async function apiSubmitBulkUserLeaves(input: CreateUserLeaveRequestDto[]): Promise<UserLeave[]> {
  const res = await api.post<ApiResponseDto<UserLeave[]> | ApiEnvelopeDto<UserLeave[]>>(
    "/usersleave/submit",
    input,
  )
  return ensureSuccess(res, "Failed to bulk submit leaves")
}

export async function apiGetUserLeaves(
  params: GetUserLeavesParams,
): Promise<
    UserLeaveListResponseDto | UserLeaveListResponseLegacyDto | UserLeaveDetailsResponseDto | UserLeaveListResponseAlternateDto
  > {
  const search = new URLSearchParams()
  search.set("page", String(params.page))
  search.set("limit", String(params.limit))
  if (params.sort) search.set("sort", params.sort)
  if (params.status) search.set("status", params.status)
  if (params.userId) search.set("userId", params.userId)
  if (params.filterUserId) search.set("filterUserId", params.filterUserId)
  if (params.action) search.set("action", params.action)
  if (params.date) search.set("date", params.date)

  const res = await api.get<
    ApiResponseDto<
      | UserLeaveListResponseDto
      | UserLeaveListResponseLegacyDto
      | UserLeaveDetailsResponseDto
      | UserLeaveListResponseAlternateDto
    > | ApiEnvelopeDto<
      | UserLeaveListResponseDto
      | UserLeaveListResponseLegacyDto
      | UserLeaveDetailsResponseDto
      | UserLeaveListResponseAlternateDto
    >
  >(`/usersleave?${search.toString()}`)
  return ensureSuccess(res, "Failed to load leave requests")
}
