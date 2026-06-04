import { useGetDepartmentMappedReports } from "../queries/getDepartmentMappedReports"
import { useGetDepartmentReportOptions } from "../queries/getDepartmentReportOptions"

/**
 * Report-setting tab APIs — only run while tab 3 is active.
 * - GET /report when the tab is opened
 * - GET /departments/:id/reports when department id exists
 */
export function useDepartmentReportSettingsTabQueries(
  isTabActive: boolean,
  departmentId: string | null,
) {
  const canFetchMapped = isTabActive && !!departmentId

  const reportOptionsQuery = useGetDepartmentReportOptions(isTabActive)
  const mappedReportsQuery = useGetDepartmentMappedReports(departmentId, canFetchMapped, {
    method: "reportscreen",
  })

  return {
    reportOptions: reportOptionsQuery.data ?? [],
    isReportOptionsLoading:
      isTabActive &&
      (reportOptionsQuery.isPending || reportOptionsQuery.isFetching),
    mappedReports: mappedReportsQuery.data,
    isMappedReportsLoading:
      canFetchMapped &&
      (mappedReportsQuery.isPending || mappedReportsQuery.isFetching),
  }
}
