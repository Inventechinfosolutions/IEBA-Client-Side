import { useGetSettings } from "@/features/settings/queries/getSettings"
import { useUpdateSettings } from "@/features/settings/mutations/updateSettings"

export function useSettingsModule() {
  const detailQuery = useGetSettings()
  const updateMutation = useUpdateSettings()

  return {
    settings: detailQuery.data,
    // Only treat the initial load as "loading" so the UI doesn't flash
    // when we refetch after saving.
    isLoading: detailQuery.isLoading,
    isFetching: detailQuery.isFetching,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}

