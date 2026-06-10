// Report PDF data layer — unwrap API responses, grouping, titles, and image helpers.

import { formatCountyDisplayName } from "@/features/department/lib/departmentReport.utils"

export type ReportDataRecord = {
  employeename: string
  program: string
  activity: string
  mastercode: string
  activitytime: string | number
  traveltime: string | number
}

export type GroupedProgram = {
  program: string
  records: ReportDataRecord[]
  totalActivityTimeForProg: number
  totalTravelTime: number
  totalTime: number
}

export type GroupedEmployee = {
  empname: string
  programs: GroupedProgram[]
}

export type ReportPdfMeta = {
  reportCode: string
  countyName?: string
  countyLogoSrc?: string
  rightLogoSrc?: string
  reportTitle?: string
}

export type ResolvedReportPdfMeta = {
  reportCode: string
  countyName: string
  reportTitle: string
  countyLogoSrc?: string
  rightLogoSrc?: string
}

export type P100ReportPdfProps = {
  records: ReportDataRecord[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type P101GroupedActivity = {
  activity: string
  records: ReportDataRecord[]
  totalActivityTimeForActivity: number
  totalTravelTime: number
  totalTime: number
}

export type P101GroupedEmployee = {
  employeename: string
  activities: P101GroupedActivity[]
}

export type P101ReportPdfProps = {
  records: ReportDataRecord[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type P110SSRecord = {
  employeename: string
  date: string
  program: string
  subactivity: string
  description: string
  activitytime: string | number
}

export type P110SSDateGroup = {
  date: string
  records: P110SSRecord[]
  totalActivityTime: number
  totalTime: number
}

export type P110SSGroupedEmployee = {
  employeename: string
  dates: P110SSDateGroup[]
}

export type P110SSReportPdfProps = {
  employees: P110SSGroupedEmployee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type P110Record = {
  employeename: string
  date: string
  program: string
  subactivity: string
  description: string
  mastercode: string
  activitytime: string | number
  traveltime: string | number
}

export type P110DateGroup = {
  date: string
  records: P110Record[]
  totalActivityTime: number
  totalTravelTime: number
  totalTime: number
}

export type P110GroupedEmployee = {
  employeename: string
  dates: P110DateGroup[]
}

export type P110ReportPdfProps = {
  employees: P110GroupedEmployee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type P111Record = {
  employeename: string
  date: string
  starttime: string
  endtime: string
  program: string
  subactivity: string
  description: string
  mastercode: string
  activitytime: string | number
}

export type P111DateGroup = {
  date: string
  records: P111Record[]
  totalActivityTime: number
}

export type P111GroupedEmployee = {
  employeename: string
  dates: P111DateGroup[]
}

export type P111ReportPdfProps = {
  employees: P111GroupedEmployee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type P130Activity = {
  subactivity: string
  activitytime: number
}

export type P130Employee = {
  employeename: string
  employeeactivitytotal: number
  employeeactivitypercentage: string
  activities: P130Activity[]
}

export type P130Program = {
  program: string
  programcode: string
  programtotal: number
  programtotalpercentage: number
  employees: P130Employee[]
}

export type P130ReportData = {
  programs: P130Program[]
}

export type P130ReportPdfProps = {
  programs: P130Program[]
  programCodes: string
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type Dssrpt1DateEntry = {
  date: string
  activityTime: string | number
}

export type Dssrpt1Activity = {
  activityCode: string
  activityName: string
  dates: Dssrpt1DateEntry[]
}

export type Dssrpt1Employee = {
  employeeName: string
  empl: string
  Unit: string
  employeePosition?: string
  activities: Dssrpt1Activity[]
  diaplyTotals: Dssrpt1DateEntry[]
  nonAllocable: Dssrpt1DateEntry[]
  totalHours: Dssrpt1DateEntry[]
}

export type DSSRPT1ReportPdfProps = {
  employees: Dssrpt1Employee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type Dssrpt2Program = {
  activityCode: string
  activityName: string
  activityTime: number
  allocatedFte: number
}

export type Dssrpt2GroupedEmployee = {
  employeename: string
  employeeId: string
  totalActivityTime: number
  totalFteHours: number
  programs: Dssrpt2Program[]
}

export type Dssrpt2ReportDetails = {
  reportCode: string
  runDate: string
}

export type DSSRPT2Unwrapped = {
  employees: Dssrpt2GroupedEmployee[]
  reportDetails: Dssrpt2ReportDetails
  periodStarting: string
  periodEnding: string
}

export type DSSRPT2ReportPdfProps = {
  employees: Dssrpt2GroupedEmployee[]
  reportDetails: Dssrpt2ReportDetails
  periodStarting: string
  periodEnding: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type ReportPdfFooterVariant = "signature" | "signaturePerPage" | "pageOnly" | "minimal"

// --- unwrap /report/data ---

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

const NESTED_LIST_KEYS = ["records", "reportData", "rows", "result", "items"] as const

function unwrapListData(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== "object") return []

  const obj = raw as Record<string, unknown>

  for (const key of NESTED_LIST_KEYS) {
    if (Array.isArray(obj[key])) return obj[key] as unknown[]
  }

  const data = obj.data
  if (Array.isArray(data)) return data

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>
    for (const key of NESTED_LIST_KEYS) {
      if (Array.isArray(nested[key])) return nested[key] as unknown[]
    }
    if (Array.isArray(nested.data)) return nested.data as unknown[]
  }

  return []
}

export function unwrapReportDataRecords(raw: unknown): ReportDataRecord[] {
  return unwrapListData(raw).map((row) => {
    const record = asRecord(row)
    return {
      employeename: String(record.employeename ?? record.employeeName ?? ""),
      program: String(record.program ?? ""),
      activity: String(record.activity ?? ""),
      mastercode: String(record.mastercode ?? record.masterCode ?? ""),
      activitytime: (record.activitytime ?? record.activityTime ?? 0) as string | number,
      traveltime: (record.traveltime ?? record.travelTime ?? 0) as string | number,
    }
  })
}

export function formatReportDisplayDate(raw?: string): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch
    return `${mm}-${dd}-${yyyy}`
  }
  return trimmed
}

function parseDateEntries(raw: unknown): Dssrpt1DateEntry[] {
  if (!Array.isArray(raw)) return []
  return raw.map((entry) => {
    const row = asRecord(entry)
    return {
      date: String(row.date ?? ""),
      activityTime: (row.activityTime ?? row.activitytime ?? 0) as string | number,
    }
  })
}

function parseActivities(raw: unknown): Dssrpt1Activity[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      activityCode: String(row.activityCode ?? ""),
      activityName: String(row.activityName ?? ""),
      dates: parseDateEntries(row.dates),
    }
  })
}

export function unwrapDssrpt1Employees(raw: unknown): Dssrpt1Employee[] {
  return unwrapListData(raw).map((item) => {
    const row = asRecord(item)
    return {
      employeeName: String(row.employeeName ?? row.employeename ?? ""),
      empl: String(row.empl ?? row.employeeId ?? ""),
      Unit: String(row.Unit ?? row.unit ?? ""),
      employeePosition: String(row.employeePosition ?? row.position ?? ""),
      activities: parseActivities(row.activities),
      diaplyTotals: parseDateEntries(row.diaplyTotals),
      nonAllocable: parseDateEntries(row.nonAllocable),
      totalHours: parseDateEntries(row.totalHours),
    }
  })
}

// --- P100 grouping ---

function toNumber(value: string | number): number {
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

export function groupReportDataByEmployee(records: ReportDataRecord[]): GroupedEmployee[] {
  return records.reduce<GroupedEmployee[]>((acc, curr) => {
    let employee = acc.find((emp) => emp.empname === curr.employeename)

    if (!employee) {
      employee = { empname: curr.employeename, programs: [] }
      acc.push(employee)
    }

    let program = employee.programs.find((prog) => prog.program === curr.program)

    if (!program) {
      program = {
        program: curr.program,
        records: [],
        totalActivityTimeForProg: 0,
        totalTravelTime: 0,
        totalTime: 0,
      }
      employee.programs.push(program)
    }

    program.records.push(curr)
    program.totalActivityTimeForProg += toNumber(curr.activitytime)
    program.totalTravelTime += toNumber(curr.traveltime)
    program.totalTime = program.totalActivityTimeForProg + program.totalTravelTime

    return acc
  }, [])
}

export function getEmployeeGrandTotals(employee: GroupedEmployee): {
  activityTime: number
  travelTime: number
  totalTime: number
} {
  const activityTime = employee.programs.reduce((sum, program) => sum + program.totalActivityTimeForProg, 0)
  const travelTime = employee.programs.reduce((sum, program) => sum + program.totalTravelTime, 0)
  const totalTime = employee.programs.reduce((sum, program) => sum + program.totalTime, 0)
  return { activityTime, travelTime, totalTime }
}

export function formatReportTime(value: string | number): string {
  const n = Number(value)
  return n ? n.toFixed(2) : "0.00"
}

// --- P101 grouping (by activity within employee) ---

export function groupP101DataByEmployee(records: ReportDataRecord[]): P101GroupedEmployee[] {
  return records.reduce<P101GroupedEmployee[]>((acc, curr) => {
    let employee = acc.find((emp) => emp.employeename === curr.employeename)

    if (!employee) {
      employee = { employeename: curr.employeename, activities: [] }
      acc.push(employee)
    }

    let activityGroup = employee.activities.find((act) => act.activity === curr.activity)

    if (!activityGroup) {
      activityGroup = {
        activity: curr.activity,
        records: [],
        totalActivityTimeForActivity: 0,
        totalTravelTime: 0,
        totalTime: 0,
      }
      employee.activities.push(activityGroup)
    }

    activityGroup.records.push(curr)
    const activityTime = toNumber(curr.activitytime)
    const travelTime = toNumber(curr.traveltime)
    activityGroup.totalActivityTimeForActivity += activityTime
    activityGroup.totalTravelTime += travelTime
    activityGroup.totalTime += activityTime + travelTime

    return acc
  }, [])
}

export function getP101EmployeeGrandTotals(employee: P101GroupedEmployee): {
  activityTime: number
  travelTime: number
  totalTime: number
} {
  const activityTime = employee.activities.reduce(
    (sum, activity) => sum + activity.totalActivityTimeForActivity,
    0,
  )
  const travelTime = employee.activities.reduce((sum, activity) => sum + activity.totalTravelTime, 0)
  const totalTime = employee.activities.reduce((sum, activity) => sum + activity.totalTime, 0)
  return { activityTime, travelTime, totalTime }
}

export function calculateP101Percentage(value: number, grandTotal: number): string {
  if (!grandTotal || grandTotal === 0) return "0.00%"
  return `${((value / grandTotal) * 100).toFixed(2)}%`
}

// --- P110-SS unwrap / grouping ---

export function unwrapP110SSRecords(raw: unknown): P110SSRecord[] {
  return unwrapListData(raw).map((row) => {
    const record = asRecord(row)
    return {
      employeename: String(record.employeename ?? record.employeeName ?? ""),
      date: String(record.date ?? ""),
      program: String(record.program ?? ""),
      subactivity: String(record.subactivity ?? record.subActivity ?? record.activity ?? ""),
      description: String(record.description ?? record.comments ?? ""),
      activitytime: (record.activitytime ?? record.activityTime ?? 0) as string | number,
    }
  })
}

export function groupP110SSByEmployee(records: P110SSRecord[]): P110SSGroupedEmployee[] {
  const grouped: Record<
    string,
    { employeename: string; dates: Record<string, P110SSDateGroup> }
  > = {}

  for (const record of records) {
    if (!grouped[record.employeename]) {
      grouped[record.employeename] = { employeename: record.employeename, dates: {} }
    }

    const employee = grouped[record.employeename]
    if (!employee.dates[record.date]) {
      employee.dates[record.date] = {
        date: record.date,
        records: [],
        totalActivityTime: 0,
        totalTime: 0,
      }
    }

    const dateGroup = employee.dates[record.date]
    dateGroup.records.push(record)
    const activityTime = toNumber(record.activitytime)
    dateGroup.totalActivityTime += activityTime
    dateGroup.totalTime += activityTime
  }

  return Object.values(grouped).map((employee) => ({
    employeename: employee.employeename,
    dates: Object.values(employee.dates),
  }))
}

export function getP110SSGrandTotal(employee: P110SSGroupedEmployee): number {
  return employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalTime, 0)
}

// --- P110 unwrap / grouping ---

export function unwrapP110Records(raw: unknown): P110Record[] {
  return unwrapListData(raw).map((row) => {
    const record = asRecord(row)
    return {
      employeename: String(record.employeename ?? record.employeeName ?? ""),
      date: String(record.date ?? ""),
      program: String(record.program ?? ""),
      subactivity: String(record.subactivity ?? record.subActivity ?? record.activity ?? ""),
      description: String(record.description ?? record.comments ?? ""),
      mastercode: String(record.mastercode ?? record.masterCode ?? ""),
      activitytime: (record.activitytime ?? record.activityTime ?? 0) as string | number,
      traveltime: (record.traveltime ?? record.travelTime ?? 0) as string | number,
    }
  })
}

export function groupP110ByEmployee(records: P110Record[]): P110GroupedEmployee[] {
  const grouped: Record<
    string,
    { employeename: string; dates: Record<string, P110DateGroup> }
  > = {}

  for (const record of records) {
    if (!grouped[record.employeename]) {
      grouped[record.employeename] = { employeename: record.employeename, dates: {} }
    }

    const employee = grouped[record.employeename]
    if (!employee.dates[record.date]) {
      employee.dates[record.date] = {
        date: record.date,
        records: [],
        totalActivityTime: 0,
        totalTravelTime: 0,
        totalTime: 0,
      }
    }

    const dateGroup = employee.dates[record.date]
    dateGroup.records.push(record)
    const activityTime = toNumber(record.activitytime)
    const travelTime = toNumber(record.traveltime)
    dateGroup.totalActivityTime += activityTime
    dateGroup.totalTravelTime += travelTime
    dateGroup.totalTime += activityTime + travelTime
  }

  return Object.values(grouped).map((employee) => ({
    employeename: employee.employeename,
    dates: Object.values(employee.dates),
  }))
}

export function getP110GrandTotals(employee: P110GroupedEmployee): {
  activityTime: number
  travelTime: number
  totalTime: number
} {
  const activityTime = employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalActivityTime, 0)
  const travelTime = employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalTravelTime, 0)
  const totalTime = employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalTime, 0)
  return { activityTime, travelTime, totalTime }
}

// --- P111 unwrap / grouping ---

export function unwrapP111Records(raw: unknown): P111Record[] {
  return unwrapListData(raw).map((row) => {
    const record = asRecord(row)
    return {
      employeename: String(record.employeename ?? record.employeeName ?? ""),
      date: String(record.date ?? ""),
      starttime: String(record.starttime ?? record.startTime ?? ""),
      endtime: String(record.endtime ?? record.endTime ?? ""),
      program: String(record.program ?? ""),
      subactivity: String(record.subactivity ?? record.subActivity ?? record.activity ?? ""),
      description: String(record.description ?? record.comments ?? ""),
      mastercode: String(record.mastercode ?? record.masterCode ?? ""),
      activitytime: (record.activitytime ?? record.activityTime ?? 0) as string | number,
    }
  })
}

export function groupP111ByEmployee(records: P111Record[]): P111GroupedEmployee[] {
  const grouped: Record<
    string,
    { employeename: string; dates: Record<string, P111DateGroup> }
  > = {}

  for (const record of records) {
    if (!grouped[record.employeename]) {
      grouped[record.employeename] = { employeename: record.employeename, dates: {} }
    }

    const employee = grouped[record.employeename]
    if (!employee.dates[record.date]) {
      employee.dates[record.date] = {
        date: record.date,
        records: [],
        totalActivityTime: 0,
      }
    }

    const dateGroup = employee.dates[record.date]
    dateGroup.records.push(record)
    dateGroup.totalActivityTime += toNumber(record.activitytime)
  }

  return Object.values(grouped).map((employee) => ({
    employeename: employee.employeename,
    dates: Object.values(employee.dates),
  }))
}

export function getP111GrandTotal(employee: P111GroupedEmployee): number {
  return employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalActivityTime, 0)
}

// --- P130 unwrap ---

function parseP130Activities(raw: unknown): P130Activity[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const row = asRecord(item)
    return {
      subactivity: String(row.subactivity ?? row.activity ?? row.subActivity ?? ""),
      activitytime: toNumber((row.activitytime ?? row.activityTime ?? 0) as string | number),
    }
  })
}

function formatP130Percentage(value: string | number): string {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  return raw.includes("%") ? raw : `${toNumber(raw).toFixed(2)}%`
}

function parseP130Employees(raw: unknown): P130Employee[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const row = asRecord(item)
    return {
      employeename: String(row.employeename ?? row.employeeName ?? ""),
      employeeactivitytotal: toNumber(
        (row.employeeactivitytotal ?? row.employeeActivityTotal ?? 0) as string | number,
      ),
      employeeactivitypercentage: formatP130Percentage(
        (row.employeeactivitypercentage ?? row.employeeActivityPercentage ?? "") as string | number,
      ),
      activities: parseP130Activities(row.activities),
    }
  })
}

function parseP130Programs(raw: unknown): P130Program[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item) => {
    const row = asRecord(item)
    return {
      program: String(row.program ?? ""),
      programcode: String(row.programcode ?? row.programCode ?? ""),
      programtotal: toNumber((row.programtotal ?? row.programTotal ?? 0) as string | number),
      programtotalpercentage: toNumber(
        (row.programtotalpercentage ?? row.programTotalPercentage ?? 0) as string | number,
      ),
      employees: parseP130Employees(row.employees),
    }
  })
}

function extractP130ProgramsFromRecord(record: Record<string, unknown>): P130Program[] | null {
  if (!Array.isArray(record.programs)) return null
  return parseP130Programs(record.programs)
}

export function unwrapP130Response(raw: unknown): P130ReportData {
  const direct = extractP130ProgramsFromRecord(asRecord(raw))
  if (direct) return { programs: direct }

  const list = unwrapListData(raw)
  if (list.length > 0) {
    const fromFirst = extractP130ProgramsFromRecord(asRecord(list[0]))
    if (fromFirst) return { programs: fromFirst }
  }

  const root = asRecord(raw)
  const data = root.data
  if (data && typeof data === "object") {
    const fromData = extractP130ProgramsFromRecord(data as Record<string, unknown>)
    if (fromData) return { programs: fromData }

    if (Array.isArray(data) && data.length > 0) {
      const fromNested = extractP130ProgramsFromRecord(asRecord(data[0]))
      if (fromNested) return { programs: fromNested }
    }
  }

  return { programs: [] }
}

export function getP130ProgramCodes(programs: P130Program[]): string {
  return programs
    .map((program) => program.programcode)
    .filter(Boolean)
    .join(", ")
}

export function getP130GrandTotalHours(programs: P130Program[]): number {
  return programs.reduce(
    (sum, program) =>
      sum + program.employees.reduce((employeeSum, employee) => employeeSum + employee.employeeactivitytotal, 0),
    0,
  )
}

// --- DSSRPT1 helpers ---

export function formatDssrpt1EmployeeName(rawName: string): string {
  return String(rawName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function getWeekHeaderLabels(allDates: string[]): [string, string, string, string] {
  return [0, 1, 2, 3].map((weekIndex) => {
    const weekDates = allDates.slice(weekIndex * 7, weekIndex * 7 + 7)
    return weekDates
      .map((date) => {
        const parts = date.split("-")
        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : date
      })
      .join(" ")
  }) as [string, string, string, string]
}

function getValueForDate(sourceData: Dssrpt1DateEntry[] | undefined, date: string): string {
  if (!sourceData?.length) return "0.00"
  const found = sourceData.find((entry) => entry.date === date)
  const val = found ? Number(found.activityTime) : 0
  return Number.isFinite(val) ? val.toFixed(2) : "0.00"
}

export function getWeeklyCellTexts(
  sourceData: Dssrpt1DateEntry[] | undefined,
  allDates: string[],
): [string, string, string, string] {
  return [0, 1, 2, 3].map((weekIndex) => {
    const weekDates = allDates.slice(weekIndex * 7, weekIndex * 7 + 7)
    return weekDates.map((date) => getValueForDate(sourceData, date)).join(" ")
  }) as [string, string, string, string]
}

export function getRowTotal(sourceData: Dssrpt1DateEntry[] | undefined): string {
  if (!sourceData?.length) return "0.00"
  const sum = sourceData.reduce((total, entry) => total + Number(entry.activityTime || 0), 0)
  return Number.isFinite(sum) ? sum.toFixed(2) : "0.00"
}

export function getAllReportDates(employees: Dssrpt1Employee[]): string[] {
  return employees[0]?.diaplyTotals?.map((entry) => entry.date) ?? []
}

export function hasDssrpt1ReportData(employees: Dssrpt1Employee[]): boolean {
  return employees.length > 0 && (employees[0]?.diaplyTotals?.length ?? 0) > 0
}

// --- DSSRPT2 helpers ---

function parseDssrpt2Programs(raw: unknown): Dssrpt2Program[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      activityCode: String(row.activitycode ?? row.activityCode ?? ""),
      activityName: String(row.activityname ?? row.activityName ?? ""),
      activityTime: toNumber((row.activitytime ?? row.activityTime ?? 0) as string | number),
      allocatedFte: toNumber((row.allocatedfte ?? row.allocatedFte ?? 0) as string | number),
    }
  })
}

function unwrapDssrpt2ReportDetails(raw: unknown): Dssrpt2ReportDetails {
  const root = asRecord(raw)
  const data = root.data
  const nested = data && typeof data === "object" ? asRecord(data) : root
  const reportData = asRecord(
    nested.reportData ??
      nested.reportdata ??
      nested.reportDetails ??
      root.reportData ??
      root.reportdata,
  )

  const reportCode = String(
    reportData.reportCode ?? reportData.reportcode ?? nested.reportCode ?? "DSSRPT2",
  )
  const runDateRaw = reportData.runDate ?? reportData.rundate ?? reportData.run_date

  return {
    reportCode,
    runDate: formatDssrpt2RunDate(runDateRaw),
  }
}

export function formatDssrpt2RunDate(raw: unknown): string {
  if (raw == null || raw === "") return formatPrintedOnLabel()
  const parsed = new Date(String(raw))
  if (Number.isNaN(parsed.getTime())) return String(raw)
  return parsed.toLocaleDateString("en-US")
}

export function formatDssrpt2EmployeeName(rawName: string): string {
  if (!rawName) return ""
  return rawName
    .split(",")
    .map((part) =>
      part
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
    )
    .join(", ")
}

export function sortDssrpt2ByActivityCode(a: Dssrpt2Program, b: Dssrpt2Program): number {
  const codeA = a.activityCode
  const codeB = b.activityCode

  const matchA = codeA.match(/^([A-Za-z]*)(\d+)?/)
  const matchB = codeB.match(/^([A-Za-z]*)(\d+)?/)

  const prefixA = matchA?.[1] ?? ""
  const prefixB = matchB?.[1] ?? ""
  const numA = matchA?.[2] != null ? Number(matchA[2]) : null
  const numB = matchB?.[2] != null ? Number(matchB[2]) : null

  const prefixCompare = prefixA.localeCompare(prefixB, undefined, { sensitivity: "base" })
  if (prefixCompare !== 0) return prefixCompare

  if (numA !== null && numB !== null) return numA - numB
  if (numA !== null) return 1
  if (numB !== null) return -1

  return codeA.localeCompare(codeB, undefined, { sensitivity: "base" })
}

function groupDssrpt2ByEmployee(
  rows: Array<{
    employeename: string
    employeeId: string
    totalFteHours: number
    programs: Dssrpt2Program[]
  }>,
): Dssrpt2GroupedEmployee[] {
  const grouped = new Map<string, Dssrpt2GroupedEmployee>()

  for (const emp of rows) {
    const name = formatDssrpt2EmployeeName(emp.employeename)
    const activityTotal = emp.programs.reduce((sum, program) => sum + program.activityTime, 0)
    const existing = grouped.get(name)

    if (!existing) {
      grouped.set(name, {
        employeename: name,
        employeeId: emp.employeeId,
        totalActivityTime: activityTotal,
        totalFteHours: emp.totalFteHours,
        programs: [...emp.programs],
      })
      continue
    }

    existing.totalActivityTime += activityTotal
    existing.totalFteHours += emp.totalFteHours
    existing.programs.push(...emp.programs)
  }

  return Array.from(grouped.values())
}

export function unwrapDssrpt2Response(raw: unknown, fallbackDates?: {
  startDate?: string
  endDate?: string
}): DSSRPT2Unwrapped {
  const list = unwrapListData(raw)
  const reportDetails = unwrapDssrpt2ReportDetails(raw)

  const rows = list.map((item) => {
    const row = asRecord(item)
    return {
      employeename: String(row.employeename ?? row.employeeName ?? ""),
      employeeId: String(row.employeeId ?? row.employeeid ?? row.empl ?? ""),
      totalFteHours: toNumber((row.totalftehours ?? row.totalFteHours ?? 0) as string | number),
      startdate: String(row.startdate ?? row.startDate ?? ""),
      enddate: String(row.enddate ?? row.endDate ?? ""),
      programs: parseDssrpt2Programs(row.programs),
    }
  })

  const periodStarting =
    rows[0]?.startdate || fallbackDates?.startDate || ""
  const periodEnding =
    rows[0]?.enddate || fallbackDates?.endDate || ""

  return {
    employees: groupDssrpt2ByEmployee(rows),
    reportDetails,
    periodStarting,
    periodEnding,
  }
}

// --- report titles / footers ---

export function resolveReportTitle(
  reportCode: string,
  options?: { activityCodeTypes?: string[] },
): string {
  switch (reportCode) {
    case "P100":
      return "P100 - Summation of Employee Time"
    case "P101":
      return "P101 - Summation of Employee Time (Sort by Function Code)"
    case "P110":
      return "P110 - Time Study Daily"
    case "P110-SS":
      return "P110-SS - Time Study Daily"
    case "P111":
      return "P111 - Time Study Daily Start/Stop"
    case "P112":
      return "P112 - Time Study Daily Start/Stop/Travel"
    case "P130":
      return "P130 - TS Program Report"
    case "TSCR":
      return "TIME STUDY CALCULATIONS REPORT"
    case "WIC":
      return "WIC TimeStudy"
    case "MCAH-TVTS":
      return "MCAH - MONTHLY TITLE V TIME STUDY (TVTS)"
    case "AC741":
      return "AC741 Activity Summary"
    case "DSSRPT2":
      return "Time Study Hours - DSSRPT2"
    case "DSSRPT3":
      return "Time Study Hours - DSSRPT3"
    case "DSSRPT4":
      return "TIME STUDY SUMMARY BY COST POOL"
    case "DSSRPT5":
      return "SALARY & BENEFITS BY EMPLOYEE"
    case "TCM_MAA_ADHOC": {
      const types = options?.activityCodeTypes?.filter(Boolean) ?? []
      return types.length > 0 ? `${types.join("_ ")}_ ADHOC` : "TCM_MAA_ADHOC"
    }
    case "DSSRPT1":
      return "DSSRPT1 Employee Individual Time Study"
    case "MAATCM": {
      const types = options?.activityCodeTypes?.filter(Boolean) ?? []
      return types.length > 0 ? `${types.join(" ")} Timestudy Report` : "MAA TCM Timestudy Report"
    }
    case "QTR-MONTH":
      return "Quarterly/Monthly Time Study Report"
    default:
      return reportCode
  }
}

export function resolveFooterVariant(reportCode: string): ReportPdfFooterVariant {
  switch (reportCode) {
    case "TSCR":
    case "DSSRPT3":
    case "DSSRPT4":
    case "DSSRPT5":
    case "MCAH-TVTS":
    case "P111":
    case "P110-SS":
    case "MAATCM":
    case "TCM_MAA_ADHOC":
      return "minimal"
    case "P130":
      return "signaturePerPage"
    case "DSSRPT1":
    case "DSSRPT2":
    case "P101":
    case "P110":
    case "WIC":
      return "pageOnly"
    default:
      return "signature"
  }
}

export function formatPrintedOnLabel(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

// --- images ---

export async function resolvePdfImageSrc(src: string | undefined): Promise<string | undefined> {
  if (!src) return undefined
  if (src.startsWith("data:")) return src

  try {
    const response = await fetch(src)
    if (!response.ok) return undefined
    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i])
    }
    const contentType = response.headers.get("content-type") || "image/png"
    return `data:${contentType};base64,${btoa(binary)}`
  } catch {
    return undefined
  }
}

export function ensurePdfBlob(blob: Blob): Blob {
  if (blob.type === "application/pdf") return blob
  return new Blob([blob], { type: "application/pdf" })
}

export async function buildResolvedPdfMeta(
  meta: ReportPdfMeta | undefined,
  defaults: { countyLogo: string; rightLogo: string },
): Promise<ResolvedReportPdfMeta> {
  const reportCode = meta?.reportCode ?? "P100"
  const [countyLogoSrc, rightLogoSrc] = await Promise.all([
    resolvePdfImageSrc(meta?.countyLogoSrc || defaults.countyLogo),
    resolvePdfImageSrc(meta?.rightLogoSrc || defaults.rightLogo),
  ])

  return {
    reportCode,
    countyName: formatCountyDisplayName(meta?.countyName),
    countyLogoSrc: countyLogoSrc ?? undefined,
    rightLogoSrc: rightLogoSrc ?? undefined,
    reportTitle: meta?.reportTitle || resolveReportTitle(reportCode),
  }
}
