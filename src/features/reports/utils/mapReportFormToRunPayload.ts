import type { ReportFormValues, ReportRunPayload } from "../types"

function parseCommaSeparatedIds(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function mapReportFormToRunPayload(values: ReportFormValues): ReportRunPayload {
  const departmentId = values.departmentId?.trim()
  const employeeIds = parseCommaSeparatedIds(values.employeeIds)
  const joinedEmployees = employeeIds.length > 0 ? employeeIds.join(",") : ""
  const activityIds = parseCommaSeparatedIds(values.activityIds)
  const joinedActivities = activityIds.length > 0 ? activityIds.join(",") : ""
  const costPoolIds = parseCommaSeparatedIds(values.costPoolIds)
  const joinedCostPools = costPoolIds.length > 0 ? costPoolIds.join(",") : ""

  return {
    reportKey: values.reportKey.trim(),
    selectMonthBy: values.selectMonthBy,
    ...(values.selectMonthBy === "qtr"
      ? {
          fiscalYearId: values.fiscalYearId?.trim(),
          quarter: values.quarter?.trim(),
        }
      : {
          dateFrom: values.dateFrom?.trim(),
          dateTo: values.dateTo?.trim(),
        }),
    ...(departmentId ? { departmentId } : {}),
    ...(employeeIds.length > 0 ? { employeeIds, employeeId: joinedEmployees } : {}),
    ...(activityIds.length > 0 ? { activityIds, activityId: joinedActivities } : {}),
    ...(costPoolIds.length > 0 ? { costPoolIds, costPoolId: joinedCostPools } : {}),
    includeActiveEmployees: values.includeActiveEmployees,
    includeInactiveEmployees: values.includeInactiveEmployees,
    includeActiveActivities: values.includeActiveActivities,
    includeInactiveActivities: values.includeInactiveActivities,
    includeActiveCostPools: values.includeActiveCostPools,
    includeInactiveCostPools: values.includeInactiveCostPools,
    includeUnapprovedTime: values.includeUnapprovedTime,
    downloadType: values.downloadType,
    ...(values.fileName?.trim() ? { fileName: values.fileName.trim() } : {}),
  }
}
