import type { GetUserModuleParams } from "../types"
import { useCreateUserModuleRow } from "../mutations/createUser"
import { useUpdateUserModuleRow } from "../mutations/updateUser"
import { useGetUserModuleRows } from "../queries/getUsers"

export function useUserModule(params: GetUserModuleParams, options?: { enabled?: boolean }) {
  const listQuery = useGetUserModuleRows(params, options)
  const createMutation = useCreateUserModuleRow()
  const updateMutation = useUpdateUserModuleRow()

  return {
    rows: listQuery.data?.items ?? [],
    totalItems: listQuery.data?.totalItems ?? 0,
    isLoading: listQuery.isLoading || listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,
    createRow: createMutation.mutate,
    createRowAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateRow: updateMutation.mutate,
    updateRowAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
