import { useGetSettings } from "@/features/settings/queries/getSettings"
import { useUpdateSettings } from "@/features/settings/mutations/updateSettings"

/** Settings detail query + save mutation for the settings form page. */
export function useSettingsFormData() {
  const detailQuery = useGetSettings()
  const saveSettingsMutation = useUpdateSettings()

  return {
    settings: detailQuery.data,
    isLoading: detailQuery.isLoading,
    isFetching: detailQuery.isFetching,
    isError: detailQuery.isError,
    error: detailQuery.error,
    refetch: detailQuery.refetch,
    saveSettings: saveSettingsMutation.mutate,
    saveSettingsAsync: saveSettingsMutation.mutateAsync,
    isSaving: saveSettingsMutation.isPending,
    saveError: saveSettingsMutation.error,
  }
}
