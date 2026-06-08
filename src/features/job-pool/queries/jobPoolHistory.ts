import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { jobPoolKeys } from "../keys"

export type JobPoolHistoryFieldChange = {
  field: string
  previousValue: unknown
  newValue: unknown
}

export type JobPoolHistorySettingsSnapshot = {
  name?: string
  description?: string | null
  status?: string
  departmentId?: number
  jobClassifications?: Array<{ id?: number; code?: string; name?: string }>
  activities?: Array<{ id?: number; code?: string; name?: string }>
  users?: Array<{ id?: string; name?: string | null }>
}

export type JobPoolHistoryRecord = {
  id: number | string
  assignmentKind?: string | null
  jobPoolId?: number | string | null
  departmentId?: number | string | null
  userId?: string | null
  activityDepartmentId?: number | string | null
  activityCode?: string | null
  activityName?: string | null
  jobClassificationId?: number | string | null
  jobClassificationCode?: string | null
  jobClassificationName?: string | null
  jobTitle?: string | null
  jobCode?: string | null
  jobPoolEvent?: string | null
  jobPoolName?: string | null
  settingsSnapshot?: JobPoolHistorySettingsSnapshot | null
  settingsChanges?: JobPoolHistoryFieldChange[] | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  assignedBy?: string | null
  unassignedBy?: string | null
  assignedByUserName?: string | null
  unassignedByUserName?: string | null
  userName?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  createdByUserName?: string | null
  createdByName?: string | null
  updatedByUserName?: string | null
  updatedByName?: string | null
}

export type JobPoolHistoryResponse = {
  data: JobPoolHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type JobPoolHistoryParams = {
  page?: number
  limit?: number
  assignmentKind?: string
  enabled?: boolean
}

export type JobPoolHistoryByIdParams = {
  jobPoolId: string
  page?: number
  limit?: number
  assignmentKind?: string
}

function unwrapJobPoolHistoryResponse(res: unknown): JobPoolHistoryResponse {
  const root = res as { data?: unknown }
  const payload = root?.data ?? res

  if (payload && typeof payload === "object" && Array.isArray((payload as JobPoolHistoryResponse).data)) {
    return payload as JobPoolHistoryResponse
  }

  return {
    data: [],
    meta: {
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 1,
      currentPage: 1,
    },
  }
}

export function useJobPoolHistoryQuery(params: JobPoolHistoryParams) {
  const {
    page = 1,
    limit = 10,
    assignmentKind = "",
    enabled = true,
  } = params

  return useQuery({
    queryKey: jobPoolKeys.history({ page, limit, assignmentKind }),
    enabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (assignmentKind.trim()) searchParams.set("assignmentKind", assignmentKind.trim())

      const res = await api.get<unknown>(`/jobpool/history?${searchParams.toString()}`)
      return unwrapJobPoolHistoryResponse(res)
    },
    staleTime: 0,
  })
}

export function useJobPoolHistoryByIdQuery(params: JobPoolHistoryByIdParams) {
  const {
    jobPoolId,
    page = 1,
    limit = 10,
    assignmentKind = "",
  } = params
  const trimmedId = jobPoolId.trim()

  return useQuery({
    queryKey: jobPoolKeys.historyById(trimmedId, { page, limit, assignmentKind }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (assignmentKind.trim()) searchParams.set("assignmentKind", assignmentKind.trim())

      const res = await api.get<unknown>(
        `/jobpool/history/${encodeURIComponent(trimmedId)}?${searchParams.toString()}`,
      )
      return unwrapJobPoolHistoryResponse(res)
    },
    enabled: trimmedId.length > 0,
    staleTime: 0,
  })
}
