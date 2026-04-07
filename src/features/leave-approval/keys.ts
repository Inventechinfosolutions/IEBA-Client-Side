import type { GetLeaveApprovalsParams } from "./types"

export const leaveApprovalKeys = {
  all: ["leave-approval"] as const,
  lists: () => [...leaveApprovalKeys.all, "list"] as const,
  list: (params: GetLeaveApprovalsParams) =>
    [...leaveApprovalKeys.lists(), { params }] as const,
}

