import { useMutation, useQueryClient } from "@tanstack/react-query"

import { leaveApprovalKeys } from "../keys"
import { updateMockLeaveApprovalRow } from "../mock"
import type { GetLeaveApprovalsParams, LeaveApprovalRow } from "../types"

export type UpdateLeaveApprovalInput = {
  id: string
  patch: Partial<Pick<LeaveApprovalRow, "status" | "commentText" | "commentsCount">>
}

export function useUpdateLeaveApproval(params: GetLeaveApprovalsParams) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, patch }: UpdateLeaveApprovalInput) => {
      updateMockLeaveApprovalRow(id, patch)
      return { id, patch }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveApprovalKeys.list(params) })
    },
  })
}

