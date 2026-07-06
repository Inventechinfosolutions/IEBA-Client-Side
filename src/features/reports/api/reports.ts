import { api } from "@/lib/api"
import {
  mapRawReportsToCatalogItems,
  mergeReportCriteriaFromCatalog,
} from "../lib/reportCatalog.utils"
import {
  formatReportDisplayDate,
  groupP110ByEmployee,
  groupP110SSByEmployee,
  groupP111ByEmployee,
  groupP112ByEmployee,
  getP130ProgramCodes,
  unwrapDssrpt1Employees,
  unwrapDssrpt2Response,
  unwrapDssrpt3Response,
  formatDssrpt5UsDate,
  formatPrintedOnLabel,
  parseMaatcmActivityCodeTypesFromMasterCode,
  resolveMaatcmIsMonthly,
  unwrapAc741Employees,
  unwrapMaatcmEmployees,
  unwrapMcahTvtsEmployees,
  unwrapQtrMonthEmployees,
  formatQtrMonthTimeStudyPeriod,
  unwrapTcmMaaAdhocPayload,
  unwrapTscrEmployees,
  unwrapWicEmployees,
  unwrapDssrpt4Response,
  unwrapDssrpt5Response,
  unwrapP110Records,
  unwrapP110SSRecords,
  unwrapP111Records,
  unwrapP112Records,
  unwrapP130Response,
  unwrapReportDataRecords,
} from "../pdf/reportPdf"
import { generateDSSRPT1ReportPdf } from "../pdf/DSSRPT1ReportPdf"
import { generateDSSRPT2ReportPdf } from "../pdf/DSSRPT2ReportPdf"
import { generateDSSRPT3ReportPdf } from "../pdf/DSSRPT3ReportPdf"
import { generateDSSRPT4ReportPdf } from "../pdf/DSSRPT4ReportPdf"
import { generateAC741ReportPdf } from "../pdf/AC741ReportPdf"
import { generateMAATCMReportPdf } from "../pdf/MAATCMReportPdf"
import { generateMCAHTVTSReportPdf } from "../pdf/MCAHTVTSReportPdf"
import { generateQTRMONTHReportPdf } from "../pdf/QTRMONTHReportPdf"
import { generateTCMMAAADHOCReportPdf } from "../pdf/TCMMAAADHOCReportPdf"
import { generateTSCRReportPdf } from "../pdf/TSCRReportPdf"
import { generateWICReportPdf } from "../pdf/WICReportPdf"
import { generateDSSRPT5ReportPdf } from "../pdf/DSSRPT5ReportPdf"
import { generateP101ReportPdf } from "../pdf/P101ReportPdf"
import { generateP110ReportPdf } from "../pdf/P110ReportPdf"
import { generateP110SSReportPdf } from "../pdf/P110SSReportPdf"
import { generateP111ReportPdf } from "../pdf/P111ReportPdf.tsx"
import { generateP112ReportPdf } from "../pdf/P112ReportPdf.tsx"
import { generateP130ReportPdf } from "../pdf/P130ReportPdf.tsx"
import { generateP100ReportPdf } from "../pdf/P100ReportPdf"
import type {
  ReportCatalogItem,
  ReportRunPayload,
  ReportSelectOption,
} from "../types"

/** Fetches the full report catalog (department settings tab only). */
export async function apiGetReportCatalog(): Promise<ReportCatalogItem[]> {
  const resData = await api.get<unknown>("/report")
  const data = Array.isArray(resData)
    ? resData
    : Array.isArray((resData as { data?: unknown }).data)
      ? (resData as { data: unknown[] }).data
      : []
  return mapRawReportsToCatalogItems(data)
}

/** GET /report/department/:departmentId/mapped?method=reportscreen — slim list for Reports run screen. */
export async function apiGetReportsByDepartment(departmentId: string): Promise<ReportCatalogItem[]> {
  const params = new URLSearchParams({ method: "reportscreen" })
  const res = await api.get<unknown>(
    `/report/department/${encodeURIComponent(departmentId)}/mapped?${params.toString()}`,
  )
  const body =
    (res as { data?: { reports?: unknown[] } })?.data ?? (res as { reports?: unknown[] })
  const reports = Array.isArray(body?.reports) ? body.reports : []
  const items = mapRawReportsToCatalogItems(reports)
  return items
}

function formatDateForBackend(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (!isoMatch) return trimmed
  const [, yyyy, mm, dd] = isoMatch
  return `${mm}-${dd}-${yyyy}`
}

function monthFromDate(raw?: string): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-\d{2}$/.exec(trimmed)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}`
  }
  return undefined
}

function buildBackendPayload(body: ReportRunPayload, overrideDownloadType?: string): Record<string, unknown> {
  const fromDate = formatDateForBackend(body.dateFrom)
  const toDate = formatDateForBackend(body.dateTo)
  const month = monthFromDate(body.dateFrom)

  const payload: Record<string, any> = {
    reportCode: body.reportKey,
    reportingPeriodType: body.selectMonthBy,
    fromDate,
    toDate,
    month,
    departmentIds: body.departmentId ? [Number(body.departmentId)] : undefined,
    userIds: body.employeeIds?.length ? body.employeeIds : undefined,
    tsprogramCodes: body.programIds?.length ? body.programIds : undefined,
    activityCodes: body.activityIds?.length ? body.activityIds : undefined,
    costPoolIds: body.costPoolIds?.length ? body.costPoolIds.map(Number) : undefined,
    unApproved: body.includeUnapprovedTime,
    checkDateId: body.checkDateId,
    downloadType: overrideDownloadType || body.downloadType,
    type: "newreports",
    maaTcmReportingPeriodType: body.maaTcmReportingPeriodType,
    ...(["MAATCM", "TCM_MAA_ADHOC"].includes(body.reportKey)
      ? {
          activityCodeType: parseMaatcmActivityCodeTypesFromMasterCode(body.masterCode),
        }
      : {}),
  }
  return payload
}

const reportFileHeaders = {
  Accept: "application/pdf, application/octet-stream, */*",
}

async function buildFrontendPdfReport(
  body: ReportRunPayload,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await api.post<unknown>("/report/data", buildBackendPayload(body), { signal })
  const startDate = formatReportDisplayDate(body.dateFrom)
  const endDate = formatReportDisplayDate(body.dateTo)
  const meta = {
    reportCode: body.reportKey,
    countyName: body.countyName,
    countyLogoSrc: body.countyLogoDataUrl,
  }

  try {
    if (body.reportKey === "DSSRPT1") {
      return await generateDSSRPT1ReportPdf({
        employees: unwrapDssrpt1Employees(response),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "DSSRPT2") {
      const dssrpt2 = unwrapDssrpt2Response(response, { startDate, endDate })
      return await generateDSSRPT2ReportPdf({
        employees: dssrpt2.employees,
        reportDetails: dssrpt2.reportDetails,
        periodStarting: dssrpt2.periodStarting,
        periodEnding: dssrpt2.periodEnding,
        meta,
      })
    }

    if (body.reportKey === "DSSRPT3") {
      return await generateDSSRPT3ReportPdf({
        payload: unwrapDssrpt3Response(response),
        isMonthly: body.selectMonthBy === "month",
        month: body.month,
        dateFrom: body.dateFrom,
        meta,
      })
    }

    if (body.reportKey === "DSSRPT4") {
      return await generateDSSRPT4ReportPdf({
        payload: unwrapDssrpt4Response(response),
        periodStarting: startDate,
        periodEnding: endDate,
        meta,
      })
    }

    if (body.reportKey === "DSSRPT5") {
      return await generateDSSRPT5ReportPdf({
        payload: unwrapDssrpt5Response(response),
        runDate: formatPrintedOnLabel(),
        payrollQuarterFrom: formatDssrpt5UsDate(body.dateFrom),
        payrollQuarterTo: formatDssrpt5UsDate(body.dateTo),
        meta,
      })
    }

    if (body.reportKey === "AC741") {
      return await generateAC741ReportPdf({
        employees: unwrapAc741Employees(response),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "MAATCM") {
      const activityCodeTypes = parseMaatcmActivityCodeTypesFromMasterCode(body.masterCode)
      return await generateMAATCMReportPdf({
        employees: unwrapMaatcmEmployees(response),
        isMonthly: resolveMaatcmIsMonthly(body),
        dateFrom: body.dateFrom,
        dateTo: body.dateTo,
        activityCodeTypes,
        meta,
      })
    }

    if (body.reportKey === "MCAH-TVTS") {
      return await generateMCAHTVTSReportPdf({
        employees: unwrapMcahTvtsEmployees(response),
        meta,
      })
    }

    if (body.reportKey === "QTR-MONTH") {
      return await generateQTRMONTHReportPdf({
        employees: unwrapQtrMonthEmployees(response),
        timeStudyPeriod: formatQtrMonthTimeStudyPeriod({
          month: monthFromDate(body.dateFrom),
          dateFrom: body.dateFrom,
        }),
        meta,
      })
    }

    if (body.reportKey === "TCM_MAA_ADHOC") {
      const activityCodeTypes = parseMaatcmActivityCodeTypesFromMasterCode(body.masterCode)
      return await generateTCMMAAADHOCReportPdf({
        payload: unwrapTcmMaaAdhocPayload(response),
        activityCodeTypes,
        meta,
      })
    }

    if (body.reportKey === "TSCR" || body.reportKey === "TSCR-MONTH") {
      return await generateTSCRReportPdf({
        employees: unwrapTscrEmployees(response),
        startDate,
        endDate,
        meta: { ...meta, reportCode: body.reportKey },
      })
    }

    if (body.reportKey === "WIC") {
      return await generateWICReportPdf({
        employees: unwrapWicEmployees(response),
        meta,
      })
    }

    if (body.reportKey === "P101") {
      return await generateP101ReportPdf({
        records: unwrapReportDataRecords(response),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "P110-SS") {
      return await generateP110SSReportPdf({
        employees: groupP110SSByEmployee(unwrapP110SSRecords(response)),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "P111") {
      return await generateP111ReportPdf({
        employees: groupP111ByEmployee(unwrapP111Records(response)),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "P112") {
      return await generateP112ReportPdf({
        employees: groupP112ByEmployee(unwrapP112Records(response)),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "P130") {
      const p130 = unwrapP130Response(response)
      return await generateP130ReportPdf({
        programs: p130.programs,
        programCodes: getP130ProgramCodes(p130.programs),
        startDate,
        endDate,
        meta,
      })
    }

    if (body.reportKey === "P110") {
      return await generateP110ReportPdf({
        employees: groupP110ByEmployee(unwrapP110Records(response)),
        startDate,
        endDate,
        meta,
      })
    }

    return await generateP100ReportPdf({
      records: unwrapReportDataRecords(response),
      startDate,
      endDate,
      meta,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed"
    throw new Error(`Could not render report PDF: ${message}`)
  }
}

/** View report: POST /report/data, then render PDF in the browser. */
export async function apiPostViewReport(
  body: ReportRunPayload,
  options?: { signal?: AbortSignal },
): Promise<unknown> {
  return buildFrontendPdfReport(body, options?.signal)
}

/** Download report: PDF is rendered in the browser; other types use /report/generate. */
export async function apiPostDownloadReport(
  body: ReportRunPayload,
  options?: { type?: string; signal?: AbortSignal },
): Promise<unknown> {
  const downloadType = options?.type || body.downloadType
  const signal = options?.signal

  if (downloadType === "PDF") {
    return buildFrontendPdfReport(body, signal)
  }

  await api.post("/report/data", buildBackendPayload(body), { signal })
  return api.post("/report/generate", buildBackendPayload(body, downloadType), {
    signal,
    headers: reportFileHeaders,
  })
}

/** Specialized lookups used by dynamic filters in the Report Form. */

export async function apiGetMaaEmployees(activityTypes: string[], departmentId?: string): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  if (activityTypes.length > 0) params.append("activityTypes", activityTypes.join(","))
  if (departmentId) params.append("departmentId", departmentId)

  const data = await api.get<any>(`/report/maa/employees?${params.toString()}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetCostPoolUsers(costPoolIds: string[], userId: string, employeeStatus?: string[]): Promise<ReportSelectOption[]> {
  // Build query string manually so commas stay raw (not percent‑encoded).
  // Each ID/value is individually encoded, then joined with a literal comma.
  const encodedCostPoolIds = costPoolIds.map(encodeURIComponent).join(",")
  const encodedUserId = encodeURIComponent(userId)
  const parts = [`costpoolIds=${encodedCostPoolIds}`, `userId=${encodedUserId}`]
  if (employeeStatus && employeeStatus.length > 0) {
    const encodedStatus = employeeStatus.map(encodeURIComponent).join(",")
    parts.push(`employeeStatus=${encodedStatus}`)
  }
  const query = parts.join("&")
  const data = await api.get<any>(`/report/cost-pools/users?${query}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []
  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetMaaTcmActivityDepartments(): Promise<ReportSelectOption[]> {
  const data = await api.get<any>("/report/maa-tcm/activity-departments")
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetTimeStudyProgramsForUsers(
  userIds: string[],
  dateFrom: string,
  dateTo: string,
  status: string = "active",
): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  if (userIds.length > 0) params.append("userIds", userIds.join(","))
  params.append("dateFrom", dateFrom)
  params.append("dateTo", dateTo)
  params.append("status", status)

  const data = await api.get<any>(`/report/timestudy-programs/by-users?${params.toString()}`)
  const list = unwrapListData(data)

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label || r.code || String(r.id),
  }))
}

export async function apiGetListAllPrograms(): Promise<ReportSelectOption[]> {
  const data = await api.get<any>("/timestudyprograms?method=listalltimestudyprograms")
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label,
  }))
}

export async function apiGetUsersUnderDepartment(
  departmentId: string,
  currentUserId: string,
  masterCode?: string,
  departmentStatus = "active",
  fromDate?: string,
  toDate?: string,
): Promise<ReportSelectOption[]> {
  const parts = [
    "type=getusersunderdepartmentbystatus",
    `departmentId=${encodeURIComponent(departmentId)}`,
    `departmentStatus=${departmentStatus.split(",").map(encodeURIComponent).join(",")}`,
    `userId=${encodeURIComponent(currentUserId)}`,
  ]
  if (masterCode) {
    const codeToSend = masterCode === "BOTH" ? "MAA,TCM" : masterCode
    const encodedCode = codeToSend.split(",").map(encodeURIComponent).join(",")
    parts.push(`masterCode=${encodedCode}`)
  }
  if (fromDate?.trim()) {
    parts.push(`fromDate=${encodeURIComponent(fromDate.trim())}`)
  }
  if (toDate?.trim()) {
    parts.push(`toDate=${encodeURIComponent(toDate.trim())}`)
  }

  const data = await api.get<any>(`/users?${parts.join("&")}`)
  const list = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []

  return list.map((r: any) => ({
    value: String(r.id),
    label: r.name || r.label || `${r.firstName || ""} ${r.lastName || ""}`.trim(),
  }))
}

function unwrapListData(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === "object") {
    const d = "data" in raw ? (raw as any).data : raw
    if (Array.isArray(d)) return d
    if (d && typeof d === "object" && Array.isArray((d as any).data)) return (d as any).data
  }
  return []
}

/** Reports filter: activities available for selected users within a date range. */
export async function apiGetActivitiesByDepartmentAndUsers(
  departmentId: string,
  userIds: string[],
  startDate?: string,
  endDate?: string,
  activityStatus = "active",
  masterCode?: string,
): Promise<ReportSelectOption[]> {
  const encodedUserIds = userIds.map(encodeURIComponent).join(",")
  const parts = [`userIds=${encodedUserIds}`]
  if (startDate) parts.push(`startDate=${encodeURIComponent(startDate)}`)
  if (endDate) parts.push(`endDate=${encodeURIComponent(endDate)}`)
  parts.push(`activityStatus=${activityStatus.split(",").map(encodeURIComponent).join(",")}`)
  if (departmentId) parts.push(`departmentId=${encodeURIComponent(departmentId)}`)
  if (masterCode) {
    const codeToSend = masterCode === "BOTH" ? "MAA,TCM" : masterCode
    const encodedCode = codeToSend.split(",").map(encodeURIComponent).join(",")
    parts.push(`masterCode=${encodedCode}`)
  }

  const raw = await api.get<any>(`/report/activity-departments/by-records?${parts.join("&")}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.value ?? r.id ?? r.activityDepartmentId ?? r.activityId ?? ""),
      label: r.label || r.name || r.code || String(r.id ?? ""),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}

/** Reports filter: cost pools available for a department. */
export async function apiGetCostPoolsByDepartment(departmentId: string): Promise<ReportSelectOption[]> {
  const search = new URLSearchParams()
  search.set("page", "1")
  search.set("limit", "1000")
  search.set("departmentId", departmentId)
  search.set("costpoolStatus", "active")

  const raw = await api.get<any>(`/costpool?${search.toString()}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.id ?? ""),
      label: r.name || r.label || String(r.id ?? ""),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}

export async function apiGetRmtsPayPeriods(
  fiscalYear: string,
  departmentId: string,
): Promise<ReportSelectOption[]> {
  const search = new URLSearchParams()
  search.set("fiscalyear", fiscalYear)
  search.set("departmentId", departmentId)

  const raw = await api.get<any>(`/rmtspayperiods?${search.toString()}`)
  const list = unwrapListData(raw)

  return list
    .map((r: any) => ({
      value: String(r.id || r.payPeriodId || r.value || ""),
      label: r.name || r.label || r.description || String(r.id || ""),
      startDate: typeof r.startdt === "string" ? r.startdt : (typeof r.startDate === "string" ? r.startDate : undefined),
      endDate: typeof r.enddt === "string" ? r.enddt : (typeof r.endDate === "string" ? r.endDate : undefined),
    }))
    .filter((o: ReportSelectOption) => o.value.trim() !== "")
}

export async function apiGetReportsDepartments(userId: string): Promise<any[]> {
  const data = await api.get<any>(`/report/reportsdepartment?userId=${encodeURIComponent(userId)}`)
  return Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []
}

export async function apiGetCheckDatesFromPayroll(
  departmentId: string,
  fromDate: string,
  toDate: string
): Promise<ReportSelectOption[]> {
  const params = new URLSearchParams()
  params.append("departmentId", departmentId)
  params.append("fromDate", fromDate)
  params.append("toDate", toDate)
  const data = await api.get<any>(`/report/getcheckdateFrompayroll?${params.toString()}`)
  const list = unwrapListData(data)
  return list.map((r: any) => ({
    value: String(r.checkDateId || r.checkDate || r.checkdate || r.id || ""),
    label: r.checkDate || r.checkdate || String(r.id || ""),
  }))
}


