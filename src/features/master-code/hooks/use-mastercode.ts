import { useCreateMasterCode } from "../mutations/create-mastercode"
import { useUpdateMasterCode } from "../mutations/update-mastercode"
import { useUpdateTenantMasterCode } from "../mutations/update-tenant-mastercode"
import { useGetMasterCodes } from "../queries/get-mastercodes"
import { useTenantMasterCodeByName } from "../queries/get-tenant-mastercodes"
import type { GetMasterCodesParams } from "../types"

export function useMasterCodes(params: GetMasterCodesParams) {
  const listQuery = useGetMasterCodes({
    codeType: params.codeType,
    inactiveOnly: params.inactiveOnly,
    page: params.page,
    pageSize: params.pageSize,
  })

  // Fetch tenant-specific row for allowMultiCode toggle
  const tenantQuery = useTenantMasterCodeByName(params.codeType)

  const createMutation = useCreateMasterCode()
  const updateMutation = useUpdateMasterCode()
  const updateTenantMutation = useUpdateTenantMasterCode()

  return {
    // List Query Data
    rows: listQuery.data?.items ?? [],
    totalItems: listQuery.data?.totalItems ?? 0,
    isLoading: listQuery.isLoading || listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: listQuery.refetch,

    // Tenant Query Data
    selectedTenantMaster: tenantQuery.data ?? null,
    isTenantLoading: tenantQuery.isLoading,

    // Mutations
    createMasterCode: createMutation.mutate,
    createMasterCodeAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    updateMasterCode: updateMutation.mutate,
    updateMasterCodeAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    updateTenantMaster: updateTenantMutation.mutate,
    updateTenantMasterAsync: updateTenantMutation.mutateAsync,
    isTenantUpdating: updateTenantMutation.isPending,
  }
}
