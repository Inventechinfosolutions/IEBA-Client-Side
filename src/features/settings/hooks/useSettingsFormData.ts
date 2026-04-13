import { useGetSettings, useGetPayrollSettings } from "@/features/settings/queries/getSettings"
import { useUpdateSettings } from "@/features/settings/mutations/updateSettings"

/** Settings detail query + save mutation for the settings form page. */
export function useSettingsFormData() {
  const detailQuery = useGetSettings()
  const payrollQuery = useGetPayrollSettings()
  const saveSettingsMutation = useUpdateSettings()

  // Merge payroll into settings only when both are available
  const settings = detailQuery.data
    ? {
        ...detailQuery.data,
        payroll: payrollQuery.data ?? detailQuery.data.payroll,
      }
    : undefined

  return {
    settings,
    isLoading: detailQuery.isLoading || payrollQuery.isLoading,
    isFetching: detailQuery.isFetching || payrollQuery.isFetching,
    isError: detailQuery.isError || payrollQuery.isError,
    error: detailQuery.error ?? payrollQuery.error,
    refetch: detailQuery.refetch,
    saveSettings: saveSettingsMutation.mutate,
    saveSettingsAsync: saveSettingsMutation.mutateAsync,
    isSaving: saveSettingsMutation.isPending,
    saveError: saveSettingsMutation.error,
  }
}
