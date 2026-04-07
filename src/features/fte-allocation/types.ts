// ─── Fiscal Year ────────────────────────────────────────────────────────────

export type FiscalYear = {
  id: string
  label: string // e.g. "2025-2026"
}

// ─── MOM (Month-over-Month) ─────────────────────────────────────────────────

export const MONTHS = [
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
] as const

export type Month = (typeof MONTHS)[number]

// ─── Employee ────────────────────────────────────────────────────────────────

export type Employee = {
  id: string
  name: string
  active: boolean
}

// ─── Program Row ─────────────────────────────────────────────────────────────

export type ProgramRow = {
  id: string
  program: string
  budgetedFte: number
  allocatedFte: number
  /** MOM allocations per month key */
  momAllocations: Record<Month, number>
}

// ─── FTE Filter Form ─────────────────────────────────────────────────────────

export type FteFilterFormValues = {
  fiscalYearId: string
  search: string
  inactive: boolean
}

// ─── EmployeesTable Props ─────────────────────────────────────────────────────

export type EmployeesTableProps = {
  fiscalYears: FiscalYear[]
  employees: Employee[]
  selectedEmployeeId: string | null
  isLoading?: boolean
  filters: FteFilterFormValues
  onFiscalYearChange: (fiscalYearId: string) => void
  onSearchChange: (value: string) => void
  onInactiveChange: (value: boolean) => void
  onEmployeeSelect: (employeeId: string) => void
}

export type EmployeesTableComponentProps = Omit<
  EmployeesTableProps,
  "fiscalYears" | "onFiscalYearChange" | "onSearchChange"
>

// ─── ProgramTable Props ───────────────────────────────────────────────────────

export type ProgramTableProps = {
  programs: ProgramRow[]
  selectedEmployeeId: string | null
  isLoading?: boolean
  onUpdate: (values: ProgramsUpdateFormValues) => void | Promise<void>
}

// ─── FteTableProps (legacy, used by page) ────────────────────────────────────

export type FteTableProps = EmployeesTableProps &
  ProgramTableProps & {
    programs: ProgramRow[]
  }

// ─── Sort ─────────────────────────────────────────────────────────────────────

export const FTE_SORT_DIRECTION = {
  ASC: "asc",
  DESC: "desc",
} as const

export type FteSortDirection =
  | (typeof FTE_SORT_DIRECTION)[keyof typeof FTE_SORT_DIRECTION]
  | null

export const FTE_SORT_STATE = {
  NONE: "none",
  ASC: FTE_SORT_DIRECTION.ASC,
  DESC: FTE_SORT_DIRECTION.DESC,
} as const

export type FteSortState =
  (typeof FTE_SORT_STATE)[keyof typeof FTE_SORT_STATE]
export type ProgramFormRow = ProgramRow

export type ProgramsUpdateFormValues = {
  programs: ProgramFormRow[]
}

export type MomUpdateFormValues = {
  programId: string
} & Record<Month, number>
