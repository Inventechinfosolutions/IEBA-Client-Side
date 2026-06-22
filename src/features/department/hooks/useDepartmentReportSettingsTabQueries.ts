import { useMemo } from "react"
import { useGetDepartmentReportOptions } from "../queries/getDepartmentReportOptions"
import { useGetAssignedAndUnassignedReports } from "../queries/getAssignedAndUnassignedReports"

/**
 * Report-setting tab APIs — only run while tab 3 is active.
 * - GET /departments/:id/reports/assigned-unassigned if department id exists
 * - GET /report if creating a new department (no ID yet)
 */
export function useDepartmentReportSettingsTabQueries(
  isTabActive: boolean,
  departmentId: string | null,
) {
  const isExisting = !!departmentId
  const canFetchAssignedUnassigned = isTabActive && isExisting
  const canFetchAllOptions = isTabActive && !isExisting

  const reportOptionsQuery = useGetDepartmentReportOptions(canFetchAllOptions)
  const assignedUnassignedQuery = useGetAssignedAndUnassignedReports(
    departmentId,
    canFetchAssignedUnassigned,
  )

  const result = useMemo(() => {
    if (isExisting) {
      const assigned = assignedUnassignedQuery.data?.assigned ?? []
      const unassigned = assignedUnassignedQuery.data?.unassigned ?? []
      const reportOptions = [...assigned, ...unassigned]
      const mappedReports = {
        nameSpace: "",
        countyName: "",
        departmentId: Number(departmentId),
        name: "",
        reportIds: assigned.map((r) => r.id),
        reports: [],
      }
      return {
        reportOptions,
        isReportOptionsLoading:
          assignedUnassignedQuery.isPending || assignedUnassignedQuery.isFetching,
        mappedReports,
        isMappedReportsLoading:
          assignedUnassignedQuery.isPending || assignedUnassignedQuery.isFetching,
      }
    } else {
      return {
        reportOptions: reportOptionsQuery.data ?? [],
        isReportOptionsLoading:
          reportOptionsQuery.isPending || reportOptionsQuery.isFetching,
        mappedReports: undefined,
        isMappedReportsLoading: false,
      }
    }
  }, [
    isExisting,
    departmentId,
    reportOptionsQuery.data,
    reportOptionsQuery.isPending,
    reportOptionsQuery.isFetching,
    assignedUnassignedQuery.data,
    assignedUnassignedQuery.isPending,
    assignedUnassignedQuery.isFetching,
  ])

  return result
}
