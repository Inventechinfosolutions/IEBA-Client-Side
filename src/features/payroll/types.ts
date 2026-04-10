import type { SingleSelectOption } from "@/components/ui/dropdown"

export * from "./enums/payrollFrequency"
import { type PayrollFrequencyType } from "./enums/payrollFrequency"

/** Period granularity for payroll details filters. */
export type PayrollPeriodType = "month" | "quarterly"

/** One row shown in the horizontally scrollable payroll grid. */
export type PayrollManagementRow = {
  employeeId: string
  employeeLastName: string
  employeeFirstName: string
  employeeMiddleName: string
  suffix: string
  department: string
  bargainingUnit: string
  type: string
  position: string
  payPeriodBegin: string
  payPeriodEnd: string
  checkDate: string
  fica: string
  pers: string
  defComp: string
  cafeteria: string
  lifeInsurance: string
  standby: string
  spa: string
  cellStipend: string
  std: string
  ot: string
  recruitingIncentive: string
  cashOut: string
  payout: string
  salary: string
  year: string
  month: string
  payrollType: string
}



export type PayrollFilterOption = SingleSelectOption

export type PayrollEmployeeOption = PayrollFilterOption

export type PayrollFilterOptionsResponse = {
  fiscalYears: readonly PayrollFilterOption[]
  monthOptions: readonly PayrollFilterOption[]
  quarterOptions: readonly PayrollFilterOption[]
  departments: readonly PayrollFilterOption[]
  employees: readonly PayrollEmployeeOption[]
}

export type GetPayrollRowsParams = {
  payrollType: PayrollFrequencyType
  fiscalYearId: string
  fiscalYearLabel: string
  periodType: PayrollPeriodType
  monthOrQuarterId: string
  departmentId: string
  departmentCode: string
  employeeIds: readonly string[]
}

export type PayrollUploadFormValues = {
  uploadType: PayrollFrequencyType
}

export type PayrollDetailsFormValues = {
  payrollType: PayrollFrequencyType
  fiscalYearId: string
  periodType: PayrollPeriodType
  monthOrQuarterId: string
  departmentId: string
  /** Comma-separated tokens for `MultiSelectDropdown`. */
  employeeIdsSerialized: string
}

export type PayrollUploadSectionProps = {
  isUploading: boolean
  onSubmitUpload: (values: PayrollUploadFormValues, file: File | null) => void
}

export type PayrollDetailsSectionProps = {
  filterOptions: PayrollFilterOptionsResponse
  isOptionsLoading: boolean
  isRowsLoading: boolean
  onGetRows: (params: GetPayrollRowsParams) => void
  onDownloadCurrentRows: () => void
  onDelete: (params: GetPayrollRowsParams) => void
  activeQueryParams: GetPayrollRowsParams | null
}

export type PayrollDataTableProps = {
  rows: readonly PayrollManagementRow[]
  isLoading: boolean
}
