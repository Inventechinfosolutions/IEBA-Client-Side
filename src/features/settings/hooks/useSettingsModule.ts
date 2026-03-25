import { useGetSettings } from "@/features/settings/queries/getSettings"
import { useUpdateSettings } from "@/features/settings/mutations/updateSettings"

export function useSettingsModule() {
  const detailQuery = useGetSettings()
  const updateMutation = useUpdateSettings()

  return {
    settings: detailQuery.data,
    isLoading: detailQuery.isLoading || detailQuery.isFetching,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}

