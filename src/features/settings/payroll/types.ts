export type PayrollBy = "Weekly" | "Bi-Weekly" | "Semi-Monthly" | "Monthly"

export type PayrollColumnSettingModel = {
  key: string
  label: string
  enabled: boolean
  editable: boolean
}

export type PayrollSettingsModel = {
  payrollBy: PayrollBy
  columns: PayrollColumnSettingModel[]
}

export type ColumnNameSortState = "none" | "asc" | "desc"

export type SortablePayrollRowProps = {
  row: PayrollColumnSettingModel
  storageIndex: number
  updateRow: (index: number, patch: Partial<PayrollColumnSettingModel>) => void
}

export const PAYROLL_COLUMN_DEFS = [
  { key: "payPeriodBegin", label: "Pay Period Begin" },
  { key: "department", label: "Department" },
  { key: "employeeMiddleName", label: "Employee Middle Name" },
  { key: "employeeLastName", label: "Employee Last Name" },
  { key: "bargainingUnit", label: "Bargaining Unit" },
  { key: "type", label: "Type" },
  { key: "position", label: "Position" },
  { key: "suffix", label: "Suffix" },
  { key: "payPeriodEnd", label: "Pay Period End" },
  { key: "checkDate", label: "Check Date" },
  { key: "fica", label: "FICA" },
  { key: "pers", label: "PERS" },
] as const

export const PAYROLL_TABLE_SCROLL_MAX_HEIGHT_PX = 430

export const PAYROLL_BY_OPTIONS: PayrollBy[] = ["Weekly", "Bi-Weekly", "Semi-Monthly", "Monthly"]

export type BackendPayrollSettingItem = {
  id: number
  columnname: string
  displayOrder: number | null
  isEnable: boolean
  isEditable: boolean
  slno: number
}

export type PayrollSettingsResponse = {
  items: BackendPayrollSettingItem[]
  payrollPeriod?: string
}

export type PayrollSettingsBulkUpdateColumn = {
  id: number
  columnname?: string
  displayOrder?: number
  isEnable?: boolean
  isEditable?: boolean
  slno?: number
}

export type PayrollSettingsBulkUpdateInput = {
  payrollBy?: PayrollBy
  columns?: PayrollSettingsBulkUpdateColumn[]
}
