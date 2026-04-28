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
  const activityIds = parseCommaSeparatedIds(values.activityIds)
  const costPoolIds = parseCommaSeparatedIds(values.costPoolIds)
  const programIds = parseCommaSeparatedIds(values.programIds)

  return {
    reportKey: values.reportKey.trim(),
    selectMonthBy: values.selectMonthBy,
    ...(values.selectMonthBy === "qtr"
      ? (() => {
          const payload: any = {
            fiscalYearId: values.fiscalYearId?.trim(),
            quarter: values.quarter?.trim(),
          }
          if (values.weekId) {
            payload.dateFrom = values.dateFrom?.trim()
            payload.dateTo = values.dateTo?.trim()
            payload.weekId = values.weekId
          } else if (values.fiscalYearId && values.quarter) {
            const [y1Str, y2Str] = values.fiscalYearId.split("-")
            const y1 = Number(y1Str)
            const y2 = Number(y2Str)
            if (!isNaN(y1) && !isNaN(y2)) {
              let sm = 0, em = 0, sy = y1, ey = y1
              if (values.quarter === "Qtr-1") { sm = 7; em = 9; sy = y1; ey = y1 }
              else if (values.quarter === "Qtr-2") { sm = 10; em = 12; sy = y1; ey = y1 }
              else if (values.quarter === "Qtr-3") { sm = 1; em = 3; sy = y2; ey = y2 }
              else if (values.quarter === "Qtr-4") { sm = 4; em = 6; sy = y2; ey = y2 }
              if (sm && em) {
                payload.dateFrom = `${sy}-${String(sm).padStart(2, "0")}-01`
                const lastDay = new Date(ey, em, 0).getDate()
                payload.dateTo = `${ey}-${String(em).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
              }
            }
          }
          return payload
        })()
      : values.selectMonthBy === "month" && values.month
        ? (() => {
            const [y, m] = values.month.split("-")
            const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
            return {
              month: values.month,
              dateFrom: `${values.month}-01`,
              dateTo: `${values.month}-${String(lastDay).padStart(2, "0")}`,
            }
          })()
      : values.selectMonthBy === "year" && values.year
        ? (() => {
            const [y1, y2] = values.year.split("-")
            return {
              year: values.year,
              dateFrom: `${y1}-07-01`,
              dateTo: `${y2}-06-30`,
            }
          })()
        : {
            dateFrom: values.dateFrom?.trim(),
            dateTo: values.dateTo?.trim(),
          }),
    ...(departmentId ? { departmentId } : {}),
    ...(employeeIds.length > 0 ? { employeeIds } : {}),
    ...(activityIds.length > 0 ? { activityIds } : {}),
    ...(costPoolIds.length > 0 ? { costPoolIds } : {}),
    ...(programIds.length > 0 ? { programIds } : {}),
    includeActiveEmployees: values.includeActiveEmployees,
    includeInactiveEmployees: values.includeInactiveEmployees,
    includeActiveActivities: values.includeActiveActivities,
    includeInactiveActivities: values.includeInactiveActivities,
    includeActiveCostPools: values.includeActiveCostPools,
    includeInactiveCostPools: values.includeInactiveCostPools,
    includeActivePrograms: values.includeActivePrograms,
    includeInactivePrograms: values.includeInactivePrograms,
    includeUnapprovedTime: values.includeUnapprovedTime,
    downloadType: values.downloadType,
    ...(values.fileName?.trim() ? { fileName: values.fileName.trim() } : {}),
    ...(values.masterCode?.trim() ? { masterCode: values.masterCode.trim() } : {}),
  }

}
