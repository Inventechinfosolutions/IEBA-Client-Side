import { useGetLeaveApprovals } from "../queries/getLeaveApprovals"
import type { GetLeaveApprovalsParams } from "../types"

export function useLeaveApprovals(params: GetLeaveApprovalsParams) {
  const query = useGetLeaveApprovals(params)

  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    userOptions: query.data?.userOptions ?? [],
    isLoading: query.isLoading && (params.enabled !== false),
    isFetching: query.isFetching && (params.enabled !== false),
    error: query.error,
  }
}

