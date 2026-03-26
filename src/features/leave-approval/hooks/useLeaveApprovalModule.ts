import { useGetLeaveApprovals } from "../queries/getLeaveApprovals"
import type { GetLeaveApprovalsParams } from "../types"

export function useLeaveApprovalModule(params: GetLeaveApprovalsParams) {
  const query = useGetLeaveApprovals(params)
  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    userOptions: query.data?.userOptions ?? [{ id: "all", label: "All" }],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}

