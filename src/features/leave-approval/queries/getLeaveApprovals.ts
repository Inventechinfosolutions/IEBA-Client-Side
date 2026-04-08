import { useQuery } from "@tanstack/react-query"

import { apiGetUserLeaves, normalizeUserLeaveListPayload } from "../api"
import { leaveApprovalStatusLabel } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalStatusValue } from "../enums/leaveApprovalStatus"
import { leaveApprovalKeys } from "../keys"
import type {
  GetLeaveApprovalsParams,
  UserLeaveDetailsResponseDto,
  UserLeaveListResponseDto,
  UserLeaveListResponseLegacyDto,
} from "../types"

function isLeaveDetailsPayload(res: unknown): res is UserLeaveDetailsResponseDto {
  return (
    res !== null &&
    typeof res === "object" &&
    "totalLeaves" in res &&
    "statusCounts" in res
  )
}

export function useGetLeaveApprovals(params: GetLeaveApprovalsParams) {
  return useQuery({
    queryKey: leaveApprovalKeys.list(params),
    queryFn: async () => {
      const statusFilter: LeaveApprovalStatusValue | undefined = (() => {
        if (params.filters.type === "All") return undefined
        const entry = (
          Object.entries(leaveApprovalStatusLabel) as Array<[LeaveApprovalStatusValue, string]>
        ).find(([, label]) => label === params.filters.type)
        return entry?.[0]
      })()

      const filterUserId =
        params.filters.userId && params.filters.userId !== "all" ? params.filters.userId : undefined

      const res = await apiGetUserLeaves({
        page: params.page,
        limit: params.pageSize,
        sort: params.sort?.direction === "asc" ? "ASC" : "DESC",
        status: statusFilter,
        filterUserId,
      })

      if (isLeaveDetailsPayload(res)) {
        return {
          items: [],
          totalItems: 0,
          userOptions: [],
        }
      }

      const { rows, meta } = normalizeUserLeaveListPayload(
        res as UserLeaveListResponseDto | UserLeaveListResponseLegacyDto,
      )

      const labelByUserId = new Map<string, string>()
      for (const r of rows) {
        const uid = typeof r.userId === "string" ? r.userId.trim() : ""
        if (!uid || uid === "all") continue
        if (labelByUserId.has(uid)) continue
        const displayName = `${r.user?.firstName ?? ""} ${r.user?.lastName ?? ""}`.trim()
        labelByUserId.set(uid, displayName || uid)
      }

      const userOptions = Array.from(labelByUserId.entries())
        .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
        .map(([id, label]) => ({ id, label }))

      return {
        items: rows,
        totalItems: meta.totalItems,
        userOptions,
      }
    },
  })
}
