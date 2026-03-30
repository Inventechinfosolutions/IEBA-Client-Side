import { useCreateJobPool } from "../mutations/createJobPool"
import { useUpdateJobPool } from "../mutations/updateJobPool"
import { useGetJobPools } from "../queries/getJobPools"
import type { GetJobPoolsParams } from "../types"

export function useJobPoolModule(params: GetJobPoolsParams) {
  const query = useGetJobPools(params)
  const createMutation = useCreateJobPool()
  const updateMutation = useUpdateJobPool()

  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createJobPool: createMutation.mutate,
    createJobPoolAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateJobPool: updateMutation.mutate,
    updateJobPoolAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
