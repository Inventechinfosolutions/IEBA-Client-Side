import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { programKeys } from "../keys"
import type { ApiEnvelope } from "../types"

/** `history_kind` for Time Study program definition audit (Program module). */
export const PROGRAM_DEFINITION_HISTORY_KIND = "program_definition" as const

/** `history_kind` for user ↔ program assignment audit (User → Time Study Assignments). */
export const USER_ASSIGNMENT_HISTORY_KIND = "user_assignment" as const

export type UserProgramHistoryRecord = {
  id: number
  programCode?: string | null
  programName?: string | null
  /** Program-definition / audit style event label. */
  programEvent?: string | null
  /** Alternate API keys for the same concept (strict fields, no index signature). */
  program_event?: string | null
  changeType?: string | null
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
  userId?: string
  programId?: number
  effectiveFrom?: string
  effective_from?: string
  effectiveTo?: string | null
  effective_to?: string | null
  userName?: string | null
  assignmentType?: "normal" | "jobpoolautoassign"
  jobpoolId?: number | null
  assignedBy?: string | null
  unassignedBy?: string | null
  operation?: string | null
  event?: string | null
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
  /** Sent as `history_kind` — e.g. `program_definition` for Time Study program definition audit rows. */
  historyKind?: string
}) {
  const { page = 1, limit = 10, programCode = "", userId = "", historyKind = "" } = params
  const isUserAssignment = historyKind.trim() === USER_ASSIGNMENT_HISTORY_KIND
  const isEnabled = !isUserAssignment || userId.trim().length > 0

  return useQuery({
    queryKey: programKeys.history({
      page,
      limit,
      programCode,
      userId,
      historyKind: historyKind || "",
    }),
    enabled: isEnabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (programCode) searchParams.set("programCode", programCode)
      const kind = historyKind.trim()
      if (kind) searchParams.set("history_kind", kind)
      const uid = userId.trim()
      // User-assignment audit is always scoped by employee id; query is disabled until uid is set.
      if (isUserAssignment) {
        searchParams.set("userId", uid)
      } else if (uid) {
        searchParams.set("userId", uid)
      }

      const res = await api.get<ApiEnvelope<UserProgramHistoryResponse> | UserProgramHistoryResponse>(
        `/userprogramassignment/history?${searchParams.toString()}`
      )
      const payload =
        (res as ApiEnvelope<UserProgramHistoryResponse>).data ??
        (res as UserProgramHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
