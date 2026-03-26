import { useQuery } from "@tanstack/react-query"

import { leaveApprovalKeys } from "../keys"
import { getMockLeaveApprovals } from "../mock"
import type { GetLeaveApprovalsParams } from "../types"

export function useGetLeaveApprovals(params: GetLeaveApprovalsParams) {
  return useQuery({
    queryKey: leaveApprovalKeys.list(params),
    queryFn: () => getMockLeaveApprovals(params),
  })
}

