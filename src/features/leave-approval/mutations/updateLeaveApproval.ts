import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"
import { leaveApprovalKeys } from "../keys"
import { apiReviewUserLeave } from "../api"
import type { GetLeaveApprovalsParams } from "../types"

export type UpdateLeaveApprovalInput = {
  id: number
  action: "approved" | "rejected"
  supervisorcomment?: string
}

export function useUpdateLeaveApproval(params: GetLeaveApprovalsParams) {
  return useMutation({
    mutationFn: ({ id, action, supervisorcomment }: UpdateLeaveApprovalInput) =>
      apiReviewUserLeave(id, { status: action, supervisorcomment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveApprovalKeys.list(params) })
    },
  })
}

