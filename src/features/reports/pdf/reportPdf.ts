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

export type P112Record = {
  employeename: string
  date: string
  starttime: string
  endtime: string
  program: string
  subactivity: string
  description: string
  mastercode: string
  activitytime: string | number
  traveltime: string | number
}

export type P112DateGroup = {
  date: string
  records: P112Record[]
  totalActivityTime: number
  totalTravelTime: number
}

export type P112GroupedEmployee = {
  employeename: string
  dates: P112DateGroup[]
}

export type P112ReportPdfProps = {
  employees: P112GroupedEmployee[]
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

export type Dssrpt3Activity = {
  activityname: string
  activitycode: string
  caseworkeractivitytime: number
  supervisoractivitytime: number
  totalactivitytime: number
  totalfte: number
}

export type Dssrpt3CostPool = {
  costpoolname: string
  activities: Dssrpt3Activity[]
  caseworkertotalallochours: number
  supervisortotalallochours: number
  totalallochours: number
  totalnonallochours: number
  caseworkertotalfte: number
  supervisortotalfte: number
  totalfte: number
}

export type Dssrpt3ReportPayload = {
  fiscalYear: string
  costPools: Dssrpt3CostPool[]
  granttotalcaseworkerallocable: number
  granttotalsupervisorallocable: number
  granttotal: number
  granttotalnonallocable: number
  grantotalcaseworkerfte: number
  grantotalsupervisorfte: number
  granttotalfte: number
}

export type DSSRPT3ReportPdfProps = {
  payload: Dssrpt3ReportPayload
  isMonthly: boolean
  month?: string
  dateFrom?: string
  dateTo?: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type Dssrpt4Employee = {
  empname: string
  empalloc: number
  empnonalloc: number
  emptotal: number
  empfte: number
  empcost: number
}

export type Dssrpt4CostPool = {
  costpoolname: string
  employees: Dssrpt4Employee[]
  totalcostpoolalloc: number
  totalcostpoolnonalloc: number
  totalcostpooltotal: number
  totalfte: number
  totalcost: number
}

export type Dssrpt4ReportPayload = {
  costpools: Dssrpt4CostPool[]
  grandtotalalloc: number
  grandtotalnonalloc: number
  grandtotal: number
  grandtotalfte: number
  grandtotalcosts: number
}

export type DSSRPT4ReportPdfProps = {
  payload: Dssrpt4ReportPayload
  periodStarting: string
  periodEnding: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type Dssrpt5DateRow = {
  date: string
  empid: string
  empname: string
  salary: string | number
  fica: string | number
  pers: string | number
  cafe: string | number
  stdlife: string | number
  defcomp: string | number
  spa: string | number
  cashout: string | number
  cellstipend: string | number
  ot: string | number
  recruitingincentive: string | number
  payout: string | number
  subtotal: string | number
  standbysalary: string | number
  standbyfica: string | number
  standbysubtotal: string | number
  standbytotal: string | number
}

export type Dssrpt5ReportPayload = {
  dates: Dssrpt5DateRow[]
  gtsalary: string | number
  gtfica: string | number
  gtpers: string | number
  gtcafe: string | number
  gtstdLife: string | number
  gtdefComp: string | number
  gtspa: string | number
  gtCashout: string | number
  gtCellStipend: string | number
  gtOt: string | number
  gtRecruitingIncentive: string | number
  gtPayout: string | number
  gtsubTotal: string | number
  gtGrandTotal: string | number
  gtStandbySalary: string | number
  gtStandbyFica: string | number
  gtStandbySubtotal: string | number
  gtStandbyGrandtotal: string | number
  gtSalaryFicaSalary: string | number
  gtSalaryFicaFica: string | number
}

export type DSSRPT5ReportPdfProps = {
  payload: Dssrpt5ReportPayload
  runDate: string
  payrollQuarterFrom: string
  payrollQuarterTo: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type Ac741Program = {
  program: string
  subactivity: string
  activitytime: number
}

export type Ac741Employee = {
  employeename: string
  employeeno: string
  programs: Ac741Program[]
}

export type AC741ReportPdfProps = {
  employees: Ac741Employee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type MaatcmActivity = {
  activityname: string
  code: string
  total: number
  totalper: string
  dayValues: string[]
}

export type MaatcmEmployee = {
  employeename: string
  jobclassification: string
  employeenumber: string
  claimingunit: string
  claimingunitlocation: string
  totalhours: number
  activities: MaatcmActivity[]
  spmptotal: number
  nonspmptotal: number
  activityCodeTypes: string[]
  noofdaysinmonth: number
  month: number | string
  year: number | string
}

export type MAATCMReportPdfProps = {
  employees: MaatcmEmployee[]
  isMonthly: boolean
  dateFrom?: string
  dateTo?: string
  activityCodeTypes?: string[]
  printedOn?: string
  meta?: ReportPdfMeta
}

export type McahTvtsWeek = {
  label: string
  cat1: number
  cat2: number
  cat3: number
  total: number
}

export type McahTvtsEmployee = {
  employeename: string
  month: string
  budgetLine: string
  jobClassificationName: string
  department: string
  weeks: McahTvtsWeek[]
  category1Totals: number
  category2Totals: number
  category3Totals: number
  totalTotals: number
  category1Contribution: number
  category2Contribution: number
  category3Contribution: number
  totalContribution: number
}

export type MCAHTVTSReportPdfProps = {
  employees: McahTvtsEmployee[]
  printedOn?: string
  meta?: ReportPdfMeta
}

export type QtrMonthProgram = {
  program: string
  programcode: string
  totalEnhancedPercentageOfProgram: number
  totalnonEnhancedPercentageOfProgram: number
  totalnonClaimablePercentageOfProgram: number
  totalPercentageOfProgram: number
  salaryEnhanced: number
  salaryNonEnhanced: number
  salaryNonClaimable: number
  benefitsEnhanced: number
  benefitsNonEnhanced: number
  benefitsNonClaimable: number
  percentageOfTimeWorked: number
  totalProgramHrs: number
}

export type QtrMonthEmployee = {
  employeeName: string
  classification: string
  programs: QtrMonthProgram[]
  totalSalaryEnhanced: number
  totalSalaryNonEnhanced: number
  totalSalaryNonClaimable: number
  totalBenefitsEnhanced: number
  totalBenefitsNonEnhanced: number
  totalBenefitsNonClaimable: number
  totalPercentageOfTimeWorked: number
  totalEmployeeSalary: number
  totalEmployeeBenefits: number
}

export type QTRMONTHReportPdfProps = {
  employees: QtrMonthEmployee[]
  timeStudyPeriod: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type TcmMaaAdhocCategory = {
  name: string
}

export type TcmMaaAdhocEmployee = {
  employeename: string
  jobclassification: string
  category_hours: Record<string, number>
}

export type TcmMaaAdhocPayload = {
  categories: TcmMaaAdhocCategory[]
  employees: TcmMaaAdhocEmployee[]
}

export type TCMMAAADHOCReportPdfProps = {
  payload: TcmMaaAdhocPayload
  activityCodeTypes?: string[]
  printedOn?: string
  meta?: ReportPdfMeta
}

export type TscrProgramRecord = {
  program_name: string
  prog_nonm_hrs: number
  prog_none_hrs: number
  prog_enh_hrs: number
  nonm_perc: number
  none_perc: number
  enh_perc: number
  dis_nonm_hrs: number
  dis_none_hrs: number
  dis_enh_hrs: number
  dis_nonm_perc: number
  dis_none_perc: number
  dis_enh_perc: number
  salary_total: number
  salary_nonm: number
  salary_none: number
  salary_enh: number
  benefits_total: number
  benefits_nonm: number
  benefits_none: number
  benefits_enh: number
  proghrs: string | number
  time_perc: number
  medical_pct: number
  budget_hrs: number
  budget_perc: number
}

export type TscrEmployee = {
  full_name: string
  totalts: string
  tsrecords: TscrProgramRecord[]
}

export type TSCRReportPdfProps = {
  employees: TscrEmployee[]
  startDate: string
  endDate: string
  printedOn?: string
  meta?: ReportPdfMeta
}

export type WicDayRecord = {
  date: string
  BFPC: number
  FMNP: number
  NutritionalEducation: number
  BreastfeedingSupport: number
  ClientServices: number
  GeneralAdministration: number
  NonSpecificTravel: number
  totalWicTime: number
  others: number
  paidTimeOff: number
  TotalTime: number
}

export type WicEmployee = {
  username: string
  jobClassificationName: string
  date: string
  periodSubcaption: string
  tsrecords: WicDayRecord[]
  wic_others: number
  final: number
}

export type WICReportPdfProps = {
  employees: WicEmployee[]
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

/** Collapse whitespace so the same person/activity is not split by trailing spaces etc. */
function normalizeReportText(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

function normalizeReportKey(value: string): string {
  return normalizeReportText(value).toLowerCase()
}

export function unwrapReportDataRecords(raw: unknown): ReportDataRecord[] {
  return unwrapListData(raw).map((row) => {
    const record = asRecord(row)
    return {
      employeename: normalizeReportText(String(record.employeename ?? record.employeeName ?? "")),
      program: normalizeReportText(String(record.program ?? "")),
      activity: normalizeReportText(String(record.activity ?? "")),
      mastercode: normalizeReportText(String(record.mastercode ?? record.masterCode ?? "")),
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

/**
 * Group P101 rows by employee → activity → program.
 *
 * Employee / activity matching is case-insensitive and whitespace-normalized so
 * the same person is not split across multiple pages when the API returns
 * slight name variants (e.g. trailing space). Duplicate program lines under an
 * activity are summed — P101 is a summation report.
 */
export function groupP101DataByEmployee(records: ReportDataRecord[]): P101GroupedEmployee[] {
  const employees: P101GroupedEmployee[] = []
  const employeeIndexByKey = new Map<string, number>()

  for (const curr of records) {
    const employeeKey = normalizeReportKey(curr.employeename)
    if (!employeeKey) continue

    let employeeIdx = employeeIndexByKey.get(employeeKey)
    if (employeeIdx === undefined) {
      employeeIdx = employees.length
      employeeIndexByKey.set(employeeKey, employeeIdx)
      employees.push({ employeename: curr.employeename, activities: [] })
    }
    const employee = employees[employeeIdx]!

    const activityKey = normalizeReportKey(curr.activity)
    let activityGroup = employee.activities.find(
      (act) => normalizeReportKey(act.activity) === activityKey,
    )

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

    const programKey = `${normalizeReportKey(curr.program)}|${normalizeReportKey(curr.mastercode)}`
    const existingProgram = activityGroup.records.find(
      (row) =>
        `${normalizeReportKey(row.program)}|${normalizeReportKey(row.mastercode)}` === programKey,
    )

    const activityTime = toNumber(curr.activitytime)
    const travelTime = toNumber(curr.traveltime)

    if (existingProgram) {
      existingProgram.activitytime = toNumber(existingProgram.activitytime) + activityTime
      existingProgram.traveltime = toNumber(existingProgram.traveltime) + travelTime
    } else {
      activityGroup.records.push({
        ...curr,
        activitytime: activityTime,
        traveltime: travelTime,
      })
    }

    activityGroup.totalActivityTimeForActivity += activityTime
    activityGroup.totalTravelTime += travelTime
    activityGroup.totalTime += activityTime + travelTime
  }

  return employees
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

// --- P112 unwrap / grouping ---

export function unwrapP112Records(raw: unknown): P112Record[] {
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
      traveltime: (record.traveltime ?? record.travelTime ?? 0) as string | number,
    }
  })
}

export function groupP112ByEmployee(records: P112Record[]): P112GroupedEmployee[] {
  const grouped: Record<
    string,
    { employeename: string; dates: Record<string, P112DateGroup> }
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
      }
    }

    const dateGroup = employee.dates[record.date]
    dateGroup.records.push(record)
    dateGroup.totalActivityTime += toNumber(record.activitytime)
    dateGroup.totalTravelTime += toNumber(record.traveltime)
  }

  return Object.values(grouped).map((employee) => ({
    employeename: employee.employeename,
    dates: Object.values(employee.dates),
  }))
}

export function getP112GrandTotals(employee: P112GroupedEmployee): {
  activityTime: number
  travelTime: number
} {
  const activityTime = employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalActivityTime, 0)
  const travelTime = employee.dates.reduce((sum, dateGroup) => sum + dateGroup.totalTravelTime, 0)
  return { activityTime, travelTime }
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

// --- DSSRPT3 helpers ---

function parseDssrpt3Activities(raw: unknown): Dssrpt3Activity[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      activityname: String(row.activityname ?? row.activityName ?? ""),
      activitycode: String(row.activitycode ?? row.activityCode ?? ""),
      caseworkeractivitytime: toNumber(
        (row.caseworkeractivitytime ?? row.caseworkerActivityTime ?? 0) as string | number,
      ),
      supervisoractivitytime: toNumber(
        (row.supervisoractivitytime ?? row.supervisorActivityTime ?? 0) as string | number,
      ),
      totalactivitytime: toNumber(
        (row.totalactivitytime ?? row.totalActivityTime ?? 0) as string | number,
      ),
      totalfte: toNumber((row.totalfte ?? row.totalFte ?? 0) as string | number),
    }
  })
}

function parseDssrpt3CostPool(raw: Record<string, unknown>): Dssrpt3CostPool {
  return {
    costpoolname: String(raw.costpoolname ?? raw.costPoolName ?? ""),
    activities: parseDssrpt3Activities(raw.activities),
    caseworkertotalallochours: toNumber(
      (raw.caseworkertotalallochours ?? raw.caseWorkerTotalAllocHours ?? 0) as string | number,
    ),
    supervisortotalallochours: toNumber(
      (raw.supervisortotalallochours ?? raw.supervisorTotalAllocHours ?? 0) as string | number,
    ),
    totalallochours: toNumber((raw.totalallochours ?? raw.totalAllocHours ?? 0) as string | number),
    totalnonallochours: toNumber(
      (raw.totalnonallochours ?? raw.totalNonAllocHours ?? 0) as string | number,
    ),
    caseworkertotalfte: toNumber(
      (raw.caseworkertotalfte ?? raw.caseWorkerTotalFte ?? 0) as string | number,
    ),
    supervisortotalfte: toNumber(
      (raw.supervisortotalfte ?? raw.supervisorTotalFte ?? 0) as string | number,
    ),
    totalfte: toNumber((raw.totalfte ?? raw.totalFte ?? 0) as string | number),
  }
}

function parseDssrpt3Payload(raw: Record<string, unknown>): Dssrpt3ReportPayload {
  const poolsRaw = raw.costPools ?? raw.costpools
  const costPools = Array.isArray(poolsRaw)
    ? poolsRaw.map((pool) => parseDssrpt3CostPool(asRecord(pool)))
    : []

  return {
    fiscalYear: String(raw.fiscalYear ?? raw.fiscalyear ?? ""),
    costPools,
    granttotalcaseworkerallocable: toNumber(
      (raw.granttotalcaseworkerallocable ?? raw.grandTotalCaseWorkerAllocable ?? 0) as string | number,
    ),
    granttotalsupervisorallocable: toNumber(
      (raw.granttotalsupervisorallocable ?? raw.grandTotalSupervisorAllocable ?? 0) as string | number,
    ),
    granttotal: toNumber((raw.granttotal ?? raw.grandTotal ?? 0) as string | number),
    granttotalnonallocable: toNumber(
      (raw.granttotalnonallocable ?? raw.grandTotalNonAllocable ?? 0) as string | number,
    ),
    grantotalcaseworkerfte: toNumber(
      (raw.grantotalcaseworkerfte ?? raw.grandTotalCaseWorkerFte ?? 0) as string | number,
    ),
    grantotalsupervisorfte: toNumber(
      (raw.grantotalsupervisorfte ?? raw.grandTotalSupervisorFte ?? 0) as string | number,
    ),
    granttotalfte: toNumber((raw.granttotalfte ?? raw.grandTotalFte ?? 0) as string | number),
  }
}

function unwrapDssrpt3Root(raw: unknown): Record<string, unknown> {
  const list = unwrapListData(raw)
  if (list.length === 1) {
    const item = asRecord(list[0])
    if (Array.isArray(item.costPools) || Array.isArray(item.costpools)) return item
  }

  const root = asRecord(raw)
  const data = root.data
  if (Array.isArray(data) && data.length === 1) {
    const item = asRecord(data[0])
    if (Array.isArray(item.costPools) || Array.isArray(item.costpools)) return item
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = asRecord(data)
    if (Array.isArray(nested.costPools) || Array.isArray(nested.costpools)) return nested
  }
  if (Array.isArray(root.costPools) || Array.isArray(root.costpools)) return root

  return list[0] ? asRecord(list[0]) : {}
}

export function unwrapDssrpt3Response(raw: unknown): Dssrpt3ReportPayload {
  return parseDssrpt3Payload(unwrapDssrpt3Root(raw))
}

export function sortDssrpt3ByActivityCode(a: Dssrpt3Activity, b: Dssrpt3Activity): number {
  return sortDssrpt2ByActivityCode(
    { activityCode: a.activitycode, activityName: a.activityname, activityTime: 0, allocatedFte: 0 },
    { activityCode: b.activitycode, activityName: b.activityname, activityTime: 0, allocatedFte: 0 },
  )
}

export function formatDssrpt3MonthLabel(month?: string): string {
  if (!month) return ""
  const [year, monthNumber] = month.split("-")
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const index = Number(monthNumber) - 1
  const monthName = monthNames[index] ?? monthNumber
  return `Timestudy Month: ${monthName} ${year}`
}

export function getDssrpt3FiscalQuarter(dateFrom?: string): string {
  if (!dateFrom) return ""
  const trimmed = dateFrom.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  const month = isoMatch ? Number(isoMatch[2]) : new Date(trimmed).getMonth() + 1
  if (!Number.isFinite(month) || month <= 0) return ""

  if (month >= 7 && month <= 9) return "Q1"
  if (month >= 10 && month <= 12) return "Q2"
  if (month >= 1 && month <= 3) return "Q3"
  return "Q4"
}

// --- DSSRPT4 helpers ---

function parseDssrpt4Employees(raw: unknown): Dssrpt4Employee[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      empname: String(row.empname ?? row.employeeName ?? row.employeename ?? ""),
      empalloc: toNumber((row.empalloc ?? row.empAlloc ?? 0) as string | number),
      empnonalloc: toNumber((row.empnonalloc ?? row.empNonAlloc ?? 0) as string | number),
      emptotal: toNumber((row.emptotal ?? row.empTotal ?? 0) as string | number),
      empfte: toNumber((row.empfte ?? row.empFte ?? 0) as string | number),
      empcost: toNumber((row.empcost ?? row.empCost ?? 0) as string | number),
    }
  })
}

function parseDssrpt4CostPool(raw: Record<string, unknown>): Dssrpt4CostPool {
  return {
    costpoolname: String(raw.costpoolname ?? raw.costPoolName ?? ""),
    employees: parseDssrpt4Employees(raw.employees),
    totalcostpoolalloc: toNumber(
      (raw.totalcostpoolalloc ?? raw.totalCostPoolAlloc ?? 0) as string | number,
    ),
    totalcostpoolnonalloc: toNumber(
      (raw.totalcostpoolnonalloc ?? raw.totalCostPoolNonAlloc ?? 0) as string | number,
    ),
    totalcostpooltotal: toNumber(
      (raw.totalcostpooltotal ?? raw.totalCostPoolTotal ?? 0) as string | number,
    ),
    totalfte: toNumber((raw.totalfte ?? raw.totalFte ?? 0) as string | number),
    totalcost: toNumber((raw.totalcost ?? raw.totalCost ?? 0) as string | number),
  }
}

function parseDssrpt4Payload(raw: Record<string, unknown>): Dssrpt4ReportPayload {
  const poolsRaw = raw.costpools ?? raw.costPools
  const costpools = Array.isArray(poolsRaw)
    ? poolsRaw.map((pool) => parseDssrpt4CostPool(asRecord(pool)))
    : []

  return {
    costpools,
    grandtotalalloc: toNumber((raw.grandtotalalloc ?? raw.grandTotalAlloc ?? 0) as string | number),
    grandtotalnonalloc: toNumber(
      (raw.grandtotalnonalloc ?? raw.grandTotalNonAlloc ?? 0) as string | number,
    ),
    grandtotal: toNumber((raw.grandtotal ?? raw.grandTotal ?? 0) as string | number),
    grandtotalfte: toNumber((raw.grandtotalfte ?? raw.grandTotalFte ?? 0) as string | number),
    grandtotalcosts: toNumber((raw.grandtotalcosts ?? raw.grandTotalCosts ?? 0) as string | number),
  }
}

function unwrapDssrpt4Root(raw: unknown): Record<string, unknown> {
  const list = unwrapListData(raw)
  if (list.length === 1) {
    const item = asRecord(list[0])
    if (Array.isArray(item.costpools) || Array.isArray(item.costPools)) return item
  }

  const root = asRecord(raw)
  const data = root.data
  if (Array.isArray(data) && data.length === 1) {
    const item = asRecord(data[0])
    if (Array.isArray(item.costpools) || Array.isArray(item.costPools)) return item
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = asRecord(data)
    if (Array.isArray(nested.costpools) || Array.isArray(nested.costPools)) return nested
  }
  if (Array.isArray(root.costpools) || Array.isArray(root.costPools)) return root

  return list[0] ? asRecord(list[0]) : {}
}

export function unwrapDssrpt4Response(raw: unknown): Dssrpt4ReportPayload {
  return parseDssrpt4Payload(unwrapDssrpt4Root(raw))
}

export function formatDssrpt4EmployeeName(rawName: string): string {
  return String(rawName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

// --- DSSRPT5 helpers ---

function parseDssrpt5DateRow(raw: Record<string, unknown>): Dssrpt5DateRow {
  const money = (key: string, alt?: string) =>
    (raw[key] ?? (alt ? raw[alt] : undefined) ?? 0) as string | number

  return {
    date: String(raw.date ?? ""),
    empid: String(raw.empid ?? raw.empId ?? ""),
    empname: String(raw.empname ?? raw.empName ?? ""),
    salary: money("salary"),
    fica: money("fica"),
    pers: money("pers"),
    cafe: money("cafe"),
    stdlife: money("stdlife", "stdLife"),
    defcomp: money("defcomp", "defComp"),
    spa: money("spa"),
    cashout: money("cashout", "cashOut"),
    cellstipend: money("cellstipend", "cellStipend"),
    ot: money("ot"),
    recruitingincentive: money("recruitingincentive", "recruitingIncentive"),
    payout: money("payout"),
    subtotal: money("subtotal", "subTotal"),
    standbysalary: money("standbysalary", "standbySalary"),
    standbyfica: money("standbyfica", "standbyFica"),
    standbysubtotal: money("standbysubtotal", "standbySubtotal"),
    standbytotal: money("standbytotal", "standbyTotal"),
  }
}

function parseDssrpt5Payload(raw: Record<string, unknown>): Dssrpt5ReportPayload {
  const money = (key: string, alt?: string) =>
    (raw[key] ?? (alt ? raw[alt] : undefined) ?? 0) as string | number

  const datesRaw = raw.dates
  const dates = Array.isArray(datesRaw)
    ? datesRaw.map((row) => parseDssrpt5DateRow(asRecord(row)))
    : []

  return {
    dates,
    gtsalary: money("gtsalary", "gtSalary"),
    gtfica: money("gtfica", "gtFica"),
    gtpers: money("gtpers", "gtPers"),
    gtcafe: money("gtcafe", "gtCafe"),
    gtstdLife: money("gtstdLife", "gtStdLife"),
    gtdefComp: money("gtdefComp"),
    gtspa: money("gtspa", "gtSpa"),
    gtCashout: money("gtCashout"),
    gtCellStipend: money("gtCellStipend"),
    gtOt: money("gtOt"),
    gtRecruitingIncentive: money("gtRecruitingIncentive"),
    gtPayout: money("gtPayout"),
    gtsubTotal: money("gtsubTotal"),
    gtGrandTotal: money("gtGrandTotal"),
    gtStandbySalary: money("gtStandbySalary"),
    gtStandbyFica: money("gtStandbyFica"),
    gtStandbySubtotal: money("gtStandbySubtotal"),
    gtStandbyGrandtotal: money("gtStandbyGrandtotal"),
    gtSalaryFicaSalary: money("gtSalaryFicaSalary"),
    gtSalaryFicaFica: money("gtSalaryFicaFica"),
  }
}

function unwrapDssrpt5Root(raw: unknown): Record<string, unknown> {
  const root = asRecord(raw)
  const data = root.data

  if (data && typeof data === "object") {
    if (Array.isArray(data)) {
      if (data.length === 1) {
        const item = asRecord(data[0])
        if (Array.isArray(item.dates)) return item
      }
    } else {
      const nested = asRecord(data)
      if (Array.isArray(nested.dates)) return nested
    }
  }

  if (Array.isArray(root.dates)) return root

  const list = unwrapListData(raw)
  if (list.length === 1 && Array.isArray(asRecord(list[0]).dates)) {
    return asRecord(list[0])
  }

  return { dates: [] }
}

export function unwrapDssrpt5Response(raw: unknown): Dssrpt5ReportPayload {
  return parseDssrpt5Payload(unwrapDssrpt5Root(raw))
}

export function formatDssrpt5UsDate(raw?: string): string {
  if (!raw) return ""
  const trimmed = raw.trim()
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  if (isoMatch) {
    const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    return date.toLocaleDateString("en-US")
  }
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleDateString("en-US")
  return trimmed
}

export function formatDssrpt5Money(value: string | number): string {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/,/g, ""))
  const amount = Number.isFinite(parsed) ? parsed : 0
  return `$${amount.toFixed(2)}`
}

// --- AC741 helpers ---

function parseAc741Programs(raw: unknown): Ac741Program[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const row = asRecord(item)
    return {
      program: String(row.program ?? row.programcode ?? row.programCode ?? ""),
      subactivity: String(row.subactivity ?? row.subActivity ?? ""),
      activitytime: toNumber((row.activitytime ?? row.activityTime ?? 0) as string | number),
    }
  })
}

export function unwrapAc741Employees(raw: unknown): Ac741Employee[] {
  return unwrapListData(raw).map((item) => {
    const row = asRecord(item)
    return {
      employeename: String(row.employeename ?? row.employeeName ?? ""),
      employeeno: String(row.employeeno ?? row.employeeNo ?? row.employeenumber ?? ""),
      programs: parseAc741Programs(row.programs),
    }
  })
}

export function getAc741EmployeeTotalHours(programs: Ac741Program[]): number {
  return programs.reduce((sum, program) => sum + program.activitytime, 0)
}

// --- MAATCM helpers ---

function parseMaatcmActivity(raw: Record<string, unknown>, daysInMonth: number): MaatcmActivity {
  const dayValues: string[] = []
  for (let i = 1; i <= daysInMonth; i += 1) {
    const key = `day${i}`
    const value = raw[key]
    dayValues.push(value != null && value !== "" ? String(value) : "")
  }

  return {
    activityname: String(raw.activityname ?? raw.activityName ?? ""),
    code: String(raw.code ?? ""),
    total: toNumber((raw.total ?? 0) as string | number),
    totalper: String(raw.totalper ?? raw.totalPer ?? "0.00"),
    dayValues,
  }
}

function parseMaatcmEmployeeTypes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ["MAA"]
  const types = raw
    .map((value) => String(value || "").trim().toUpperCase())
    .map((value) => (value === "TMC" ? "TCM" : value))
    .filter(Boolean)
  return types.length ? [...new Set(types)] : ["MAA"]
}

export function parseMaatcmActivityCodeTypesFromMasterCode(masterCode?: string): string[] | undefined {
  if (!masterCode?.trim()) return undefined
  if (masterCode === "BOTH") return ["MAA", "TCM"]
  return masterCode
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .map((part) => (part === "TMC" ? "TCM" : part))
    .filter(Boolean)
}

export function resolveMaatcmIsMonthly(body: {
  selectMonthBy?: string
  maaTcmReportingPeriodType?: string
}): boolean {
  const period = String(body.maaTcmReportingPeriodType ?? body.selectMonthBy ?? "")
    .trim()
    .toLowerCase()
  return period === "month" || period === "monthly"
}

export function unwrapMaatcmEmployees(raw: unknown): MaatcmEmployee[] {
  return unwrapListData(raw).map((item) => {
    const row = asRecord(item)
    const noofdaysinmonth = toNumber((row.noofdaysinmonth ?? row.noOfDaysInMonth ?? 31) as string | number) || 31
    const activitiesRaw = row.activities
    const activities = Array.isArray(activitiesRaw)
      ? activitiesRaw.map((activity) => parseMaatcmActivity(asRecord(activity), noofdaysinmonth))
      : []

    return {
      employeename: String(row.employeename ?? row.employeeName ?? ""),
      jobclassification: String(row.jobclassification ?? row.jobClassification ?? ""),
      employeenumber: String(row.employeenumber ?? row.employeeNumber ?? ""),
      claimingunit: String(row.claimingunit ?? row.claimingUnit ?? ""),
      claimingunitlocation: String(row.claimingunitlocation ?? row.claimingUnitLocation ?? ""),
      totalhours: toNumber((row.totalhours ?? row.totalHours ?? 0) as string | number),
      activities,
      spmptotal: toNumber((row.spmptotal ?? row.spmpTotal ?? 0) as string | number),
      nonspmptotal: toNumber((row.nonspmptotal ?? row.nonSpmpTotal ?? 0) as string | number),
      activityCodeTypes: parseMaatcmEmployeeTypes(row.activityCodeTypes ?? row.activitycodetypes),
      noofdaysinmonth,
      month: (row.month ?? "") as number | string,
      year: (row.year ?? "") as number | string,
    }
  })
}

export function normMaatcmEmployeeTypes(employee: MaatcmEmployee): string[] {
  return employee.activityCodeTypes.length ? employee.activityCodeTypes : ["MAA"]
}

export function includeMaatcmActivityInPivot(activity: MaatcmActivity, types: string[]): boolean {
  if (!(activity.total > 0)) return false
  if (!types.includes("MAA")) return false
  if (!types.includes("TCM")) return true
  return !activity.activityname.toUpperCase().includes("TCM")
}

export function hoursByCodeForMaatcmEmployee(employee: MaatcmEmployee): Record<string, number> {
  const types = normMaatcmEmployeeTypes(employee)
  const byCode: Record<string, number> = {}

  for (const activity of employee.activities) {
    if (!includeMaatcmActivityInPivot(activity, types)) continue
    const code = activity.code.trim()
    if (!code) continue
    byCode[code] = (byCode[code] ?? 0) + activity.total
  }

  return byCode
}

export function isMaatcmSummaryEmployee(employee: MaatcmEmployee): boolean {
  const hours = hoursByCodeForMaatcmEmployee(employee)
  return Object.values(hours).reduce((sum, value) => sum + value, 0) > 0
}

export function sortMaatcmCodesAsc(codes: string[]): string[] {
  return [...codes].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
}

export function buildMaatcmActivityNameByCode(employees: MaatcmEmployee[]): Record<string, string> {
  const map: Record<string, string> = {}

  for (const employee of employees) {
    const types = normMaatcmEmployeeTypes(employee)
    if (!types.includes("MAA")) continue

    for (const activity of employee.activities) {
      const code = activity.code.trim()
      if (!code || map[code]) continue
      if (types.includes("TCM") && activity.activityname.toUpperCase().includes("TCM")) continue
      const name = activity.activityname.trim()
      if (name) map[code] = name
    }
  }

  return map
}

export function maatcmPivotPeriodDisplay(
  employees: MaatcmEmployee[],
  dateFrom?: string,
  dateTo?: string,
): { month: string; year: string } {
  if (dateFrom && dateTo) {
    const from = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? `${dateFrom}T00:00:00` : dateFrom)
    const to = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? `${dateTo}T00:00:00` : dateTo)
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      const fmt = (date: Date) =>
        `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
      return { month: `${fmt(from)} – ${fmt(to)}`, year: String(to.getFullYear()) }
    }
  }

  const employee = employees[0]
  return {
    month: employee?.month != null ? String(employee.month) : "",
    year: employee?.year != null ? String(employee.year) : "",
  }
}

export function getMaatcmDayValue(activity: MaatcmActivity, day: number): string {
  return activity.dayValues[day - 1] ?? ""
}

export function getMaatcmDayTotal(employee: MaatcmEmployee, day: number): string {
  const total = employee.activities.reduce((sum, activity) => {
    const value = getMaatcmDayValue(activity, day)
    return sum + toNumber(value)
  }, 0)
  return total > 0 ? total.toFixed(2) : ""
}

export function getMaatcmGrandTotal(employee: MaatcmEmployee): number {
  return employee.activities.reduce((sum, activity) => sum + activity.total, 0)
}

// --- MCAH-TVTS helpers ---

function parseMcahTvtsWeek(row: Record<string, unknown>, week: number): McahTvtsWeek {
  return {
    label: String(row[`weekvalue${week}`] ?? row[`weekValue${week}`] ?? ""),
    cat1: toNumber((row[`week${week}cat1`] ?? 0) as string | number),
    cat2: toNumber((row[`week${week}cat2`] ?? 0) as string | number),
    cat3: toNumber((row[`week${week}cat3`] ?? 0) as string | number),
    total: toNumber((row[`week${week}total`] ?? 0) as string | number),
  }
}

export function unwrapMcahTvtsEmployees(raw: unknown): McahTvtsEmployee[] {
  return unwrapListData(raw).map((item) => {
    const row = asRecord(item)
    const weeks = [1, 2, 3, 4, 5].map((week) => parseMcahTvtsWeek(row, week))

    const summedCat1 = weeks.reduce((sum, week) => sum + week.cat1, 0)
    const summedCat2 = weeks.reduce((sum, week) => sum + week.cat2, 0)
    const summedCat3 = weeks.reduce((sum, week) => sum + week.cat3, 0)
    const summedTotal = weeks.reduce((sum, week) => sum + week.total, 0)

    const category1Totals = toNumber(
      (row.category1Totals ?? row.category1totals ?? summedCat1) as string | number,
    )
    const category2Totals = toNumber(
      (row.category2Totals ?? row.category2totals ?? summedCat2) as string | number,
    )
    const category3Totals = toNumber(
      (row.category3Totals ?? row.category3totals ?? summedCat3) as string | number,
    )
    const totalTotals = toNumber((row.totalTotals ?? row.totaltotals ?? summedTotal) as string | number)

    return {
      employeename: String(
        row.employeename ?? row.employeeName ?? row.name ?? "",
      ),
      month: String(row.month ?? ""),
      budgetLine: String(row.budgetLine ?? row.budgetline ?? ""),
      jobClassificationName: String(
        row.jobClassificationName ??
          row.jobclassification ??
          row.positionName ??
          "",
      ),
      department: String(
        row.department ?? row.departmentName ?? row.claimingunitlocation ?? "",
      ),
      weeks,
      category1Totals,
      category2Totals,
      category3Totals,
      totalTotals,
      category1Contribution: toNumber(
        (row.category1Contribution ?? row.category1contribution ?? 0) as string | number,
      ),
      category2Contribution: toNumber(
        (row.category2Contribution ?? row.category2contribution ?? 0) as string | number,
      ),
      category3Contribution: toNumber(
        (row.category3Contribution ?? row.category3contribution ?? 0) as string | number,
      ),
      totalContribution: toNumber(
        (row.totalContribution ?? row.totalcontribution ?? (totalTotals > 0 ? 100 : 0)) as
          | string
          | number,
      ),
    }
  })
}

export function formatMcahTvtsEmployeeName(rawName: string): string {
  return String(rawName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function formatMcahTvtsHours(value: number): string {
  return value ? value.toFixed(2) : "0.00"
}

export function formatMcahTvtsPercent(value: number): string {
  return `${value ? value.toFixed(2) : "0.00"}%`
}

// --- QTR-MONTH helpers ---

function normalizeQtrMonthEnhPercent(value: unknown): number {
  if (value == null || value === "") return 0
  const parsed = toNumber(value as string | number)
  return parsed <= 1 ? parsed * 100 : parsed
}

function normalizeQtrMonthOtherPercent(value: unknown): number {
  if (value == null || value === "") return 0
  return toNumber(value as string | number)
}

function normalizeQtrMonthAllPercent(value: unknown): number {
  if (value == null || value === "") return 0
  const parsed = toNumber(value as string | number)
  return parsed <= 1 ? parsed * 100 : parsed
}

function normalizeQtrMonthGrandTotalPercent(value: unknown): number {
  if (value == null || value === "") return 0
  const parsed = toNumber(value as string | number)
  return parsed <= 1 ? parsed * 100 : parsed
}

function parseQtrMonthProgramRow(row: Record<string, unknown>): QtrMonthProgram {
  const hasNewFormat = row.programName != null || row.programCode != null

  if (hasNewFormat) {
    return {
      program: String(row.programName ?? "Unknown Program"),
      programcode: String(row.programCode ?? ""),
      totalEnhancedPercentageOfProgram: normalizeQtrMonthEnhPercent(row.enhFinalPer),
      totalnonEnhancedPercentageOfProgram: normalizeQtrMonthOtherPercent(row.nonEnhFinalPer),
      totalnonClaimablePercentageOfProgram: normalizeQtrMonthOtherPercent(row.nonClaimFinalPer),
      totalPercentageOfProgram: normalizeQtrMonthAllPercent(row.allFinalPer),
      salaryEnhanced: toNumber((row.enhSalary ?? 0) as string | number),
      salaryNonEnhanced: toNumber((row.nonEnhSalary ?? 0) as string | number),
      salaryNonClaimable: toNumber((row.nonClaimSalary ?? 0) as string | number),
      benefitsEnhanced: toNumber((row.enhBenefits ?? 0) as string | number),
      benefitsNonEnhanced: toNumber((row.nonEnhBenefits ?? 0) as string | number),
      benefitsNonClaimable: toNumber((row.nonClaimBenefits ?? 0) as string | number),
      percentageOfTimeWorked: normalizeQtrMonthOtherPercent(row.finalPerOfDistributedCostInProgram),
      totalProgramHrs: toNumber((row.totalProgramHrs ?? 0) as string | number),
    }
  }

  return {
    program: String(row.program ?? "Unknown Program"),
    programcode: String(row.programcode ?? row.programCode ?? ""),
    totalEnhancedPercentageOfProgram: normalizeQtrMonthEnhPercent(row.totalEnhancedPercentageOfProgram),
    totalnonEnhancedPercentageOfProgram: normalizeQtrMonthOtherPercent(
      row.totalnonEnhancedPercentageOfProgram,
    ),
    totalnonClaimablePercentageOfProgram: normalizeQtrMonthOtherPercent(
      row.totalnonClaimablePercentageOfProgram,
    ),
    totalPercentageOfProgram: normalizeQtrMonthAllPercent(row.totalPercentageOfProgram),
    salaryEnhanced: toNumber((row.salaryEnhanced ?? 0) as string | number),
    salaryNonEnhanced: toNumber((row.salaryNonEnhanced ?? 0) as string | number),
    salaryNonClaimable: toNumber((row.salaryNonClaimable ?? 0) as string | number),
    benefitsEnhanced: toNumber((row.benefitsEnhanced ?? 0) as string | number),
    benefitsNonEnhanced: toNumber((row.benefitsNonEnhanced ?? 0) as string | number),
    benefitsNonClaimable: toNumber((row.benefitsNonClaimable ?? 0) as string | number),
    percentageOfTimeWorked: normalizeQtrMonthOtherPercent(row.percentageOfTimeWorked),
    totalProgramHrs: toNumber(
      (row.totalProgramHrs ??
        (toNumber((row.totalDirAndAllocHoursEnhanced ?? 0) as string | number) +
          toNumber((row.totalDirAndAllocHoursNonEnhanced ?? 0) as string | number) +
          toNumber((row.totalDirAndAllocHoursNonClaimable ?? 0) as string | number))) as
        | string
        | number,
    ),
  }
}

function parseQtrMonthEmployeeRow(row: Record<string, unknown>): QtrMonthEmployee | null {
  const records = Array.isArray(row.records) ? row.records : null
  const legacyPrograms = Array.isArray(row.programs) ? row.programs : null
  const programRows = records ?? legacyPrograms

  if (!programRows?.length) return null

  const programs = programRows.map((item) => parseQtrMonthProgramRow(asRecord(item)))

  const totalSalaryEnhanced = toNumber(
    (row.totalSalaryEnhanced ?? row.enhGrandTotalSalary ?? 0) as string | number,
  )
  const totalSalaryNonEnhanced = toNumber(
    (row.totalSalaryNonEnhanced ?? row.nonEnhGrandTotalSalary ?? 0) as string | number,
  )
  const totalSalaryNonClaimable = toNumber(
    (row.totalSalaryNonClaimable ?? row.nonClaimGrandTotalSalary ?? 0) as string | number,
  )
  const totalBenefitsEnhanced = toNumber(
    (row.totalBenefitsEnhanced ?? row.enhGrandTotalBenefits ?? 0) as string | number,
  )
  const totalBenefitsNonEnhanced = toNumber(
    (row.totalBenefitsNonEnhanced ?? row.nonEnhGrandTotalBenefits ?? 0) as string | number,
  )
  const totalBenefitsNonClaimable = toNumber(
    (row.totalBenefitsNonClaimable ?? row.nonClaimGrandTotalBenefits ?? 0) as string | number,
  )

  const totalEmployeeSalary =
    toNumber((row.salary ?? 0) as string | number) ||
    totalSalaryEnhanced + totalSalaryNonEnhanced + totalSalaryNonClaimable
  const totalEmployeeBenefits =
    toNumber((row.Benefits ?? row.benefits ?? 0) as string | number) ||
    totalBenefitsEnhanced + totalBenefitsNonEnhanced + totalBenefitsNonClaimable

  return {
    employeeName: String(
      row.employeeName ?? row.empleeName ?? row.employeename ?? "",
    ),
    classification: String(
      row.userJobclassifications ?? row.classification ?? row.jobClassification ?? "",
    ),
    programs,
    totalSalaryEnhanced,
    totalSalaryNonEnhanced,
    totalSalaryNonClaimable,
    totalBenefitsEnhanced,
    totalBenefitsNonEnhanced,
    totalBenefitsNonClaimable,
    totalPercentageOfTimeWorked: normalizeQtrMonthGrandTotalPercent(
      row.totalPercentageOfTimeWorked ?? row.grandTotalPercentageOfTimeWorked,
    ),
    totalEmployeeSalary,
    totalEmployeeBenefits,
  }
}

export function unwrapQtrMonthEmployees(raw: unknown): QtrMonthEmployee[] {
  return unwrapListData(raw)
    .map((item) => parseQtrMonthEmployeeRow(asRecord(item)))
    .filter((employee): employee is QtrMonthEmployee => employee != null)
}

export function formatQtrMonthEmployeeName(rawName: string): string {
  return String(rawName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function formatQtrMonthTimeStudyPeriod(options: {
  month?: string
  dateFrom?: string
}): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]

  if (options.month) {
    const [year, month] = options.month.split("-")
    const monthName = monthNames[parseInt(month, 10) - 1] || month
    return `${monthName}-${year.slice(-2)}`
  }

  if (options.dateFrom) {
    const fromDate = new Date(options.dateFrom)
    if (!Number.isNaN(fromDate.getTime())) {
      const monthName = monthNames[fromDate.getMonth()]
      const yearShort = String(fromDate.getFullYear()).slice(-2)
      return `${monthName}-${yearShort}`
    }
  }

  return ""
}

export function formatQtrMonthMoney(value: number): string {
  return formatDssrpt5Money(value)
}

export function formatQtrMonthPercentOne(value: number): string {
  return `${parseFloat(String(value || 0)).toFixed(1)}%`
}

export function formatQtrMonthPercentTwo(value: number): string {
  return `${parseFloat(String(value || 0)).toFixed(2)}%`
}

export function getQtrMonthBottomRowValues(
  program: QtrMonthProgram,
  employee: QtrMonthEmployee,
): { percentage: number; salary: number; benefits: number } {
  const percentage = program.percentageOfTimeWorked
  const pctDecimal = percentage / 100
  return {
    percentage,
    salary: pctDecimal * employee.totalEmployeeSalary,
    benefits: pctDecimal * employee.totalEmployeeBenefits,
  }
}

// --- TCM_MAA_ADHOC helpers ---

const TCM_MAA_ADHOC_CHUNK_SIZE = 8

export function unwrapTcmMaaAdhocPayload(raw: unknown): TcmMaaAdhocPayload {
  const list = unwrapListData(raw)
  const root =
    list.length === 1 && list[0] && typeof list[0] === "object"
      ? asRecord(list[0])
      : asRecord(raw)

  const categoriesRaw =
    root.activityDetailsForAllActivityCodes ?? root.activitydetailsforallactivitycodes
  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw.map((item) => {
        const row = asRecord(item)
        return { name: String(row.name ?? "") }
      })
    : []

  const employeesRaw = root.finalobjects ?? root.finalObjects
  const employees = Array.isArray(employeesRaw)
    ? employeesRaw.map((item) => {
        const row = asRecord(item)
        const hoursRaw = asRecord(row.category_hours ?? row.categoryHours)
        const category_hours: Record<string, number> = {}
        Object.entries(hoursRaw).forEach(([key, value]) => {
          category_hours[key] = toNumber(value as string | number)
        })
        return {
          employeename: String(row.employeename ?? row.employeeName ?? ""),
          jobclassification: String(row.jobclassification ?? row.jobClassification ?? ""),
          category_hours,
        }
      })
    : []

  return { categories, employees }
}

export function sortTcmMaaAdhocEmployees(employees: TcmMaaAdhocEmployee[]): TcmMaaAdhocEmployee[] {
  return [...employees].sort((a, b) =>
    (a.employeename || "").localeCompare(b.employeename || "", undefined, { sensitivity: "base" }),
  )
}

export function chunkTcmMaaAdhocCategories(
  categories: TcmMaaAdhocCategory[],
  chunkSize = TCM_MAA_ADHOC_CHUNK_SIZE,
): TcmMaaAdhocCategory[][] {
  const chunks: TcmMaaAdhocCategory[][] = []
  for (let index = 0; index < categories.length; index += chunkSize) {
    chunks.push(categories.slice(index, index + chunkSize))
  }
  return chunks
}

export function computeTcmMaaAdhocTotals(
  employees: TcmMaaAdhocEmployee[],
  categories: TcmMaaAdhocCategory[],
): {
  employeeTotals: Record<string, number>
  grandTotalHours: number
} {
  const employeeTotals: Record<string, number> = {}
  let grandTotalHours = 0

  employees.forEach((employee) => {
    let employeeTotal = 0
    categories.forEach((category) => {
      const hours = employee.category_hours[category.name] ?? 0
      employeeTotal += hours
      grandTotalHours += hours
    })
    employeeTotals[employee.employeename] = employeeTotal
  })

  return { employeeTotals, grandTotalHours }
}

export function formatTcmMaaAdhocEmployeeName(rawName: string): string {
  if (!rawName || typeof rawName !== "string") return ""
  return rawName.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase())
}

export function formatTcmMaaAdhocHours(value: number | null | undefined): string {
  if (value === null || value === undefined) return ""
  return Number(value).toFixed(2)
}

export function formatTcmMaaAdhocColumnNumber(index: number): string {
  return index < 10 ? `0${index}` : String(index)
}

export function formatTcmMaaAdhocNspmp(value: number): string {
  return value.toFixed(2)
}

// --- TSCR helpers ---

function tscrNumber(value: unknown): number {
  return toNumber(value as string | number)
}

function parseTscrProgramRecord(row: Record<string, unknown>): TscrProgramRecord {
  const pick = (snake: string, camel?: string) =>
    tscrNumber(row[snake] ?? (camel ? row[camel] : undefined))

  return {
    program_name: String(row.program_name ?? row.programName ?? ""),
    prog_nonm_hrs: pick("prog_nonm_hrs", "progNonmHrs"),
    prog_none_hrs: pick("prog_none_hrs", "progNoneHrs"),
    prog_enh_hrs: pick("prog_enh_hrs", "progEnhHrs"),
    nonm_perc: pick("nonm_perc", "nonmPerc"),
    none_perc: pick("none_perc", "nonePerc"),
    enh_perc: pick("enh_perc", "enhPerc"),
    dis_nonm_hrs: pick("dis_nonm_hrs", "disNonmHrs"),
    dis_none_hrs: pick("dis_none_hrs", "disNoneHrs"),
    dis_enh_hrs: pick("dis_enh_hrs", "disEnhHrs"),
    dis_nonm_perc: pick("dis_nonm_perc", "disNonmPerc"),
    dis_none_perc: pick("dis_none_perc", "disNonePerc"),
    dis_enh_perc: pick("dis_enh_perc", "disEnhPerc"),
    salary_total: pick("salary_total", "salaryTotal") || pick("salary"),
    salary_nonm: pick("salary_nonm", "salaryNonm"),
    salary_none: pick("salary_none", "salaryNone"),
    salary_enh: pick("salary_enh", "salaryEnh"),
    benefits_total: pick("benefits_total", "benefitsTotal") || pick("benefits"),
    benefits_nonm: pick("benefits_nonm", "benefitsNonm"),
    benefits_none: pick("benefits_none", "benefitsNone"),
    benefits_enh: pick("benefits_enh", "benefitsEnh"),
    proghrs: (row.proghrs ?? row.progHrs ?? "") as string | number,
    time_perc: pick("time_perc", "timePerc"),
    medical_pct: pick("medical_pct", "medicalPct"),
    budget_hrs: pick("budget_hrs", "budgetHrs"),
    budget_perc: pick("budget_perc", "budgetPerc"),
  }
}

function resolveTscrEmployeeName(row: Record<string, unknown>): string {
  return String(
    row.full_name ??
      row.fullName ??
      row.employeename ??
      row.employeeName ??
      row.empname ??
      row.username ??
      row.userName ??
      row.name ??
      "",
  ).trim()
}

function resolveTscrTotalTs(row: Record<string, unknown>): string {
  return String(row.totalts ?? row.totalTs ?? row.total_ts ?? "0.00")
}

function unwrapTscrSourceRows(raw: unknown): unknown[] {
  const list = unwrapListData(raw)
  if (list.length) return list

  const root = asRecord(raw)
  const data = asRecord(root.data)

  const employees = root.employees ?? data.employees
  if (Array.isArray(employees)) return employees

  if (Array.isArray(root.tsrecords ?? root.tsRecords)) return [root]
  if (Array.isArray(data.tsrecords ?? data.tsRecords)) return [data]

  return []
}

function parseTscrEmployeeRow(row: Record<string, unknown>): TscrEmployee {
  const tsrecordsRaw = row.tsrecords ?? row.tsRecords
  const tsrecords = Array.isArray(tsrecordsRaw)
    ? tsrecordsRaw.map((record) => parseTscrProgramRecord(asRecord(record)))
    : []

  let full_name = resolveTscrEmployeeName(row)
  if (!full_name && Array.isArray(tsrecordsRaw)) {
    for (const record of tsrecordsRaw) {
      const nestedName = resolveTscrEmployeeName(asRecord(record))
      if (nestedName) {
        full_name = nestedName
        break
      }
    }
  }

  return {
    full_name,
    totalts: resolveTscrTotalTs(row),
    tsrecords,
  }
}

export function formatTscrEmployeeName(rawName: string): string {
  return String(rawName || "").trim()
}

export function unwrapTscrEmployees(raw: unknown): TscrEmployee[] {
  const list = unwrapTscrSourceRows(raw)
  if (!list.length) return []

  const hasNestedTsrecords = list.some((item) => {
    const row = asRecord(item)
    return Array.isArray(row.tsrecords ?? row.tsRecords)
  })

  if (hasNestedTsrecords) {
    return list
      .map((item) => parseTscrEmployeeRow(asRecord(item)))
      .filter((employee) => employee.tsrecords.length > 0 || employee.full_name)
  }

  const grouped = new Map<string, TscrEmployee>()

  list.forEach((item) => {
    const row = asRecord(item)
    const name = resolveTscrEmployeeName(row)
    const key = name || `__unknown__${grouped.size}`
    const existing = grouped.get(key)

    if (existing) {
      existing.tsrecords.push(parseTscrProgramRecord(row))
      if (row.totalts ?? row.totalTs ?? row.total_ts) {
        existing.totalts = resolveTscrTotalTs(row)
      }
      if (!existing.full_name && name) {
        existing.full_name = name
      }
      return
    }

    grouped.set(key, {
      full_name: name,
      totalts: resolveTscrTotalTs(row),
      tsrecords: [parseTscrProgramRecord(row)],
    })
  })

  return [...grouped.values()].filter(
    (employee) => employee.tsrecords.length > 0 || employee.full_name,
  )
}

export function formatTscrPositiveNumber(value: number): string {
  return value > 0 ? String(value) : ""
}

export function formatTscrPositiveSum(...values: number[]): string {
  const sum = values.reduce((total, value) => total + value, 0)
  return sum > 0 ? String(sum) : ""
}

export function formatTscrPositivePercent(value: number): string {
  return value > 0 ? `${value}%` : ""
}

export function formatTscrPositivePercentSum(...values: number[]): string {
  const sum = values.reduce((total, value) => total + value, 0)
  return sum > 0 ? `${sum}%` : ""
}

export function formatTscrMoneyTotal(...values: number[]): string {
  const sum = values.reduce((total, value) => total + value, 0)
  return sum > 0 ? sum.toFixed(2) : ""
}

export function formatTscrBenefitsPercent(salaryTotal: number, benefitsTotal: number): string {
  const total = salaryTotal + benefitsTotal
  if (total <= 0) return "0%"
  return `${((benefitsTotal / total) * 100).toFixed(2)}%`
}

export function formatTscrBudgetValue(value: number): string {
  return value > 0 ? value.toFixed(2) : ""
}

export function chunkTscrProgramPairs(records: TscrProgramRecord[]): Array<[TscrProgramRecord, TscrProgramRecord | null]> {
  const pairs: Array<[TscrProgramRecord, TscrProgramRecord | null]> = []
  for (let index = 0; index < records.length; index += 2) {
    pairs.push([records[index], records[index + 1] ?? null])
  }
  return pairs
}

// --- WIC helpers ---

function parseWicDayRecord(row: Record<string, unknown>): WicDayRecord {
  const pick = (snake: string, camel?: string) =>
    tscrNumber(row[snake] ?? (camel ? row[camel] : undefined))

  return {
    date: String(row.date ?? ""),
    BFPC: pick("BFPC", "bfpc"),
    FMNP: pick("FMNP", "fmnp"),
    NutritionalEducation: pick("NutritionalEducation", "nutritionalEducation"),
    BreastfeedingSupport: pick("BreastfeedingSupport", "breastfeedingSupport"),
    ClientServices: pick("ClientServices", "clientServices"),
    GeneralAdministration: pick("GeneralAdministration", "generalAdministration"),
    NonSpecificTravel: pick("NonSpecificTravel", "nonSpecificTravel"),
    totalWicTime: pick("totalWicTime", "totalWicTime"),
    others: pick("others"),
    paidTimeOff: pick("paidTimeOff", "paidTimeOff"),
    TotalTime: pick("TotalTime", "totalTime"),
  }
}

export function unwrapWicEmployees(raw: unknown): WicEmployee[] {
  return unwrapListData(raw).map((item) => {
    const row = asRecord(item)
    const tsrecordsRaw = row.tsrecords ?? row.tsRecords
    const tsrecords = Array.isArray(tsrecordsRaw)
      ? tsrecordsRaw.map((record) => parseWicDayRecord(asRecord(record)))
      : []

    return {
      username: String(row.username ?? row.userName ?? ""),
      jobClassificationName: String(
        row.jobClassificationName ?? row.jobclassificationname ?? "",
      ),
      date: String(row.date ?? ""),
      periodSubcaption: String(row.periodSubcaption ?? row.periodsubcaption ?? "Month/Year"),
      tsrecords,
      wic_others: tscrNumber((row.wic_others ?? row.wicOthers ?? 0) as string | number),
      final: tscrNumber((row.final ?? 0) as string | number),
    }
  })
}

export function formatWicDisplayDate(iso: string): string {
  if (!iso) return ""
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return iso
  return `${match[2]}/${match[3]}/${match[1]}`
}

export function formatWicEmployeeName(rawName: string): string {
  return String(rawName || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function formatWicHours(value: number): string {
  return String(value)
}

export function getWicSubTotal(record: WicDayRecord): number {
  return (
    record.FMNP +
    record.NutritionalEducation +
    record.BreastfeedingSupport +
    record.ClientServices +
    record.GeneralAdministration
  )
}

export function computeWicColumnTotals(records: WicDayRecord[]) {
  return records.reduce(
    (totals, record) => ({
      BFPC: totals.BFPC + record.BFPC,
      FMNP: totals.FMNP + record.FMNP,
      NutritionalEducation: totals.NutritionalEducation + record.NutritionalEducation,
      BreastfeedingSupport: totals.BreastfeedingSupport + record.BreastfeedingSupport,
      ClientServices: totals.ClientServices + record.ClientServices,
      GeneralAdministration: totals.GeneralAdministration + record.GeneralAdministration,
      NonSpecificTravel: totals.NonSpecificTravel + record.NonSpecificTravel,
      totalWicTime: totals.totalWicTime + record.totalWicTime,
      others: totals.others + record.others,
      paidTimeOff: totals.paidTimeOff + record.paidTimeOff,
      TotalTime: totals.TotalTime + record.TotalTime,
    }),
    {
      BFPC: 0,
      FMNP: 0,
      NutritionalEducation: 0,
      BreastfeedingSupport: 0,
      ClientServices: 0,
      GeneralAdministration: 0,
      NonSpecificTravel: 0,
      totalWicTime: 0,
      others: 0,
      paidTimeOff: 0,
      TotalTime: 0,
    },
  )
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
    case "TSCR-MONTH":
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
    case "TSCR-MONTH":
    case "DSSRPT3":
    case "DSSRPT4":
    case "DSSRPT5":
    case "MCAH-TVTS":
    case "P111":
    case "P112":
    case "P110-SS":
    case "MAATCM":
    case "TCM_MAA_ADHOC":
      return "minimal"
    case "P130":
      return "signaturePerPage"
    case "DSSRPT1":
    case "DSSRPT2":
    case "QTR-MONTH":
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

function resolveImageFetchTarget(
  src: string,
  apiBaseUrl: string,
): { url: string; useAuth: boolean } {
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  ) {
    return {
      url: src,
      useAuth: src.includes("/client/documents/preview/"),
    }
  }

  // Bundled/static assets from Vite — fetch from the app origin as-is.
  if (src.startsWith("/assets/") || src.startsWith("/src/")) {
    return { url: src, useAuth: false }
  }

  if (src.startsWith("/")) {
    const apiRoot = apiBaseUrl.replace(/\/$/, "")
    return {
      url: apiRoot ? `${apiRoot}${src}` : src,
      useAuth: src.includes("/client/documents/preview/") || src.startsWith("/client/"),
    }
  }

  return { url: src, useAuth: false }
}

export async function resolvePdfImageSrc(src: string | undefined): Promise<string | undefined> {
  if (!src) return undefined
  if (src.startsWith("data:")) return src

  try {
    const { API_BASE_URL } = await import("@/lib/config")
    const { getToken } = await import("@/lib/api")

    const { url: requestUrl, useAuth } = resolveImageFetchTarget(src, API_BASE_URL)
    const headers: Record<string, string> = {}
    const token = getToken()
    if (token && useAuth) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(requestUrl, { headers, cache: "no-store" })
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
  const countyLogoInput = meta?.countyLogoSrc?.trim() || defaults.countyLogo
  const rightLogoInput = meta?.rightLogoSrc?.trim() || defaults.rightLogo
  const [countyLogoSrc, rightLogoSrc] = await Promise.all([
    resolvePdfImageSrc(countyLogoInput),
    resolvePdfImageSrc(rightLogoInput),
  ])

  return {
    reportCode,
    countyName: formatCountyDisplayName(meta?.countyName),
    countyLogoSrc: countyLogoSrc ?? undefined,
    rightLogoSrc: rightLogoSrc ?? undefined,
    reportTitle: meta?.reportTitle || resolveReportTitle(reportCode),
  }
}
