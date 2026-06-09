import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

import { programActivityRelationKeys } from "../keys"

export type TimeStudyProgramActivityHistoryFieldChange = {
  field: string
  previousValue: unknown
  newValue: unknown
}

export type TimeStudyProgramActivityHistorySettingsSnapshot = {
  departmentId?: number | string | null
  departmentName?: string | null
  programId?: number | string | null
  programCode?: string | null
  programName?: string | null
  activityId?: number | string | null
  activityCode?: string | null
  activityName?: string | null
  activities?: Array<{ id?: number; code?: string; name?: string }>
  status?: string
  [key: string]: unknown
}

export type TimeStudyProgramActivityHistoryRecord = {
  id: number | string
  departmentId?: number | string | null
  departmentName?: string | null
  programId?: number | string | null
  programCode?: string | null
  programName?: string | null
  activityId?: number | string | null
  activityCode?: string | null
  activityName?: string | null
  programEvent?: string | null
  event?: string | null
  operation?: string | null
  changeType?: string | null
  settingsSnapshot?: TimeStudyProgramActivityHistorySettingsSnapshot | null
  settingsChanges?: TimeStudyProgramActivityHistoryFieldChange[] | null
  changes?: TimeStudyProgramActivityHistoryFieldChange[] | null
  activityChanges?: TimeStudyProgramActivityHistoryFieldChange[] | null
  programActivityChanges?: TimeStudyProgramActivityHistoryFieldChange[] | null
  createdBy?: string | null
  createdByName?: string | null
  createdByUserName?: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedBy?: string | null
  updatedByName?: string | null
  updatedByUserName?: string | null
  updatedAt?: string | null
  updated_at?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  [key: string]: unknown
}

export type TimeStudyProgramActivityHistoryMeta = {
  totalItems: number
  itemCount: number
  itemsPerPage: number
  totalPages: number
  currentPage: number
}

export type TimeStudyProgramActivityHistoryResponse = {
  data: TimeStudyProgramActivityHistoryRecord[]
  meta: TimeStudyProgramActivityHistoryMeta
}

export type TimeStudyProgramActivityHistoryParams = {
  page?: number
  limit?: number
  programCode?: string
  activityCode?: string
  departmentId?: number
  enabled?: boolean
}

function defaultHistoryMeta(
  items: TimeStudyProgramActivityHistoryRecord[],
  page = 1,
  limit = 10,
): TimeStudyProgramActivityHistoryMeta {
  const totalItems = items.length
  return {
    totalItems,
    itemCount: items.length,
    itemsPerPage: limit,
    totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    currentPage: page,
  }
}

function unwrapTimeStudyProgramActivityHistoryResponse(
  res: unknown,
  page = 1,
  limit = 10,
): TimeStudyProgramActivityHistoryResponse {
  const root = res as { data?: unknown }
  const payload = root?.data ?? res

  if (Array.isArray(payload)) {
    return {
      data: payload as TimeStudyProgramActivityHistoryRecord[],
      meta: defaultHistoryMeta(payload as TimeStudyProgramActivityHistoryRecord[], page, limit),
    }
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Partial<TimeStudyProgramActivityHistoryResponse>
    const rows = Array.isArray(obj.data) ? obj.data : []
    return {
      data: rows,
      meta: obj.meta ?? defaultHistoryMeta(rows, page, limit),
    }
  }

  return { data: [], meta: defaultHistoryMeta([], page, limit) }
}

export function useTimeStudyProgramActivityHistoryQuery(
  params: TimeStudyProgramActivityHistoryParams,
) {
  const {
    page = 1,
    limit = 10,
    programCode = "",
    activityCode = "",
    departmentId,
    enabled = true,
  } = params

  return useQuery({
    queryKey: programActivityRelationKeys.history({
      page,
      limit,
      programCode,
      activityCode,
      departmentId,
    }),
    enabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (programCode.trim()) searchParams.set("programCode", programCode.trim())
      if (activityCode.trim()) searchParams.set("activityCode", activityCode.trim())
      if (departmentId != null && Number.isFinite(departmentId) && departmentId > 0) {
        searchParams.set("departmentId", String(departmentId))
      }

      const res = await api.get<unknown>(`/timestudyprograms/history?${searchParams.toString()}`)
      return unwrapTimeStudyProgramActivityHistoryResponse(res, page, limit)
    },
    staleTime: 0,
  })
}
