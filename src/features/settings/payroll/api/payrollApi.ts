import { api } from "@/lib/api"
import type { PayrollBy, PayrollColumnSettingModel, PayrollSettingsModel } from "../types"

export type PayrollSettingsResponse = {
  items: Array<{
    id: number
    columnname: string
    displayOrder: number | null
    isEnable: boolean
    isEditable: boolean
    slno: number
  }>
  payrollPeriod?: string
}

export async function getPayrollSettings(): Promise<PayrollSettingsModel> {
  const res = await api.get<{
    success: boolean
    data: { items: any[]; payrollPeriod?: { value: string } }
  }>("/payrollmanagement/settings")
  const data = res.data

  const items = (data?.items ?? []).sort((a: any, b: any) => (a.displayOrder ?? a.slno) - (b.displayOrder ?? b.slno))
  const periodValue = data?.payrollPeriod?.value ?? "Monthly"

  // Transform backend format to frontend format
  const rows: PayrollColumnSettingModel[] = items.map((item: any) => ({
    key: item.id.toString(),
    label: item.columnname,
    enabled: Boolean(item.isEnable),
    editable: Boolean(item.isEditable),
  }))

  // Map lowercase values to frontend labels
  let payrollBy: PayrollBy = "Monthly"
  const low = periodValue.toLowerCase().replace(/[^a-z]/g, "")
  if (low === "weekly") payrollBy = "Weekly"
  else if (low === "biweekly") payrollBy = "Bi-Weekly"
  else if (low === "semimonthly") payrollBy = "Semi-Monthly"
  else if (low === "monthly") payrollBy = "Monthly"

  return {
    payrollBy,
    columns: rows,
  }
}

export async function updatePayrollSettings(data: PayrollSettingsModel): Promise<void> {
  // 1. Update Columns
  const columnsBody = data.columns.map((col, index) => ({
    id: Number(col.key) || undefined,
    columnname: col.label,
    displayOrder: index + 1,
    isEnable: col.enabled,
    isEditable: col.editable,
    slno: index + 1,
  }))

  await api.post("/payrollmanagement/settings", columnsBody)

  // 2. Update Payroll Period (PAYROLL_TYPE)
  // Map frontend labels (e.g. "Bi-Weekly") back to backend strings (e.g. "biweekly")
  let periodValue = "monthly"
  const low = data.payrollBy.toLowerCase().replace(/[^a-z]/g, "")
  if (low === "weekly") periodValue = "weekly"
  else if (low === "biweekly") periodValue = "biweekly"
  else if (low === "semimonthly") periodValue = "semimonthly"
  else if (low === "monthly") periodValue = "monthly"

  await api.put("/setting/PAYROLL_TYPE", { value: periodValue })
}
