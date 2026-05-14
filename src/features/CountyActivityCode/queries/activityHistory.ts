import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

import { countyActivityCodeKeys } from "../keys"

/** `history_kind` for county / master activity definition audit rows on `GET /users/activity-history`. */
export const ACTIVITY_DEFINITION_HISTORY_KIND = "activity_definition" as const

const USER_ASSIGNMENT_HISTORY_KIND = "user_assignment"

export type ActivityHistoryRecord = {
  id: number | string
  activityId?: number | string
  activityCode?: string | null
  activityName?: string | null
  activityEvent?: string | null
  activity_event?: string | null
  changeType?: string | null
  operation?: string | null
  event?: string | null
  userId?: string | null
  userName?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  effective_from?: string | null
  effective_to?: string | null
  createdBy?: string | null
  createdByName?: string | null
  created_by_name?: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedBy?: string | null
  updatedByName?: string | null
  updated_by_name?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

export type ActivityHistoryResponse = {
  data: ActivityHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type ActivityHistoryParams = {
  page?: number
  limit?: number
  activityCode?: string
  activityName?: string
  /** Sent as `history_kind` when provided (e.g. `activity_definition`, `user_assignment`). */
  historyKind?: string
  userId?: string
}

export function useActivityHistoryQuery(params: ActivityHistoryParams) {
  const {
    page = 1,
    limit = 10,
    activityCode = "",
    activityName = "",
    historyKind = "",
    userId = "",
  } = params

  const isUserAssignment = historyKind.trim() === USER_ASSIGNMENT_HISTORY_KIND
  const isEnabled = !isUserAssignment || userId.trim().length > 0

  return useQuery({
    queryKey: countyActivityCodeKeys.history({
      page,
      limit,
      activityCode,
      activityName,
      historyKind: historyKind || "",
      userId: userId || "",
    }),
    enabled: isEnabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (activityCode.trim()) searchParams.set("activityCode", activityCode.trim())
      if (activityName.trim()) searchParams.set("activityName", activityName.trim())
      const kind = historyKind.trim()
      if (kind) searchParams.set("history_kind", kind)
      const uid = userId.trim()
      if (isUserAssignment) {
        searchParams.set("userId", uid)
      } else if (uid) {
        searchParams.set("userId", uid)
      }

      const res = await api.get<{ data: ActivityHistoryResponse } | ActivityHistoryResponse>(
        `/users/activity-history?${searchParams.toString()}`
      )
      const payload =
        (res as { data: ActivityHistoryResponse }).data ?? (res as ActivityHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
