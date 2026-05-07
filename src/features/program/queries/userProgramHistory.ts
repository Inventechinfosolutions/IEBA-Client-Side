import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { programKeys } from "../keys"
import type { ApiEnvelope } from "../types"

export type UserProgramHistoryRecord = {
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
  id: number
  userId: string
  programId: number
  programCode: string | null
  programName: string | null
  effectiveFrom: string
  effectiveTo: string | null
  userName: string | null
  assignmentType: "normal" | "jobpoolautoassign"
  jobpoolId: number | null
  assignedBy: string | null
  unassignedBy: string | null
}

export type UserProgramHistoryResponse = {
  data: UserProgramHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export function useUserProgramHistoryQuery(params: {
  page?: number
  limit?: number
  programCode?: string
  userId?: string
}) {
  const { page = 1, limit = 10, programCode = "", userId = "" } = params
  const isEnabled = true

  return useQuery({
    queryKey: programKeys.history({ page, limit, programCode, userId }),
    enabled: isEnabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (programCode) searchParams.set("programCode", programCode)
      if (userId) searchParams.set("userId", userId)

      const res = await api.get<ApiEnvelope<UserProgramHistoryResponse>>(
        `/userprogramassignment/history?${searchParams.toString()}`
      )
      return res?.data ?? (res as unknown as UserProgramHistoryResponse)
    },
    staleTime: 0,
  })
}
