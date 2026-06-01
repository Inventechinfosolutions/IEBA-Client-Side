import { api } from "@/lib/api"
import type { 
  PayrollBy, 
  PayrollColumnSettingModel, 
  PayrollSettingsModel,
  BackendPayrollSettingItem,
  PayrollSettingsBulkUpdateInput,
  PayrollSettingsBulkUpdateColumn
} from "../types"

export async function getPayrollSettings(): Promise<PayrollSettingsModel> {
  const res = await api.get<{
    success: boolean
    data: { items: BackendPayrollSettingItem[]; payrollPeriod?: { value: string } }
  }>("/payrollmanagement/settings")
  const data = res.data

  const items = (data?.items ?? []).sort((a: BackendPayrollSettingItem, b: BackendPayrollSettingItem) => (a.displayOrder ?? a.slno) - (b.displayOrder ?? b.slno))
  const periodValue = data?.payrollPeriod?.value ?? "Monthly"

  // Transform backend format to frontend format
  const rows: PayrollColumnSettingModel[] = items.map((item: BackendPayrollSettingItem) => ({
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



function payrollByToBackendValue(payrollBy: PayrollBy): string {
  // Map frontend labels (e.g. "Bi-Weekly") back to backend strings (e.g. "biweekly")
  let periodValue = "monthly"
  const low = payrollBy.toLowerCase().replace(/[^a-z]/g, "")
  if (low === "weekly") periodValue = "weekly"
  else if (low === "biweekly") periodValue = "biweekly"
  else if (low === "semimonthly") periodValue = "semimonthly"
  else if (low === "monthly") periodValue = "monthly"
  return periodValue
}

/**
 * Update payroll column settings.
 * Uses individual PUT /payrollmanagement/settings/:id per changed column so the
 * backend only updates isEnable/isEditable/displayOrder — it never deletes records.
 *
 * NOTE: The bulk endpoint (/payrollmanagement/settings/bulk) was intentionally
 * removed because it was deleting rows from the DB instead of updating them.
 * Individual per-id PUTs are safe and correct.
 */
export async function updatePayrollSettings(data: PayrollSettingsBulkUpdateInput): Promise<void> {
  // 1) Update each changed column individually via its own PUT request.
  //    This guarantees the backend only mutates the specified fields (isEnable,
  //    isEditable, displayOrder) without removing any records.
  if (Array.isArray(data.columns) && data.columns.length > 0) {
    await Promise.all(
      data.columns.map(({ id, ...patch }: PayrollSettingsBulkUpdateColumn) =>
        api.put(`/payrollmanagement/settings/${id}`, patch),
      ),
    )
  }

  // 2) Update Payroll Period only if included
  if (data.payrollBy) {
    await api.put("/setting/PAYROLL_TYPE", { value: payrollByToBackendValue(data.payrollBy) })
  }
}
