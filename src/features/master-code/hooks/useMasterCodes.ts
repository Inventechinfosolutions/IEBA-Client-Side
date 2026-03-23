import { useCreateMasterCode } from "../mutations/createMasterCode"
import { useUpdateMasterCode } from "../mutations/updateMasterCode"
import { useGetMasterCodes } from "../queries/getMasterCodes"
import type { GetMasterCodesParams } from "../types"

export function useMasterCodes(params: GetMasterCodesParams) {
  const listQuery = useGetMasterCodes(params)
  const createMutation = useCreateMasterCode()
  const updateMutation = useUpdateMasterCode()

  return {
    rows: listQuery.data?.items ?? [],
    totalItems: listQuery.data?.totalItems ?? 0,
    isLoading: listQuery.isLoading || listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createMasterCode: createMutation.mutate,
    createMasterCodeAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateMasterCode: updateMutation.mutate,
    updateMasterCodeAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
