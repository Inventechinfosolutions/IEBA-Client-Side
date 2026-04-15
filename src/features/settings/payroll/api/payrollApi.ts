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
 * Bulk update payroll column settings.
 * Backend does not expose a single bulk endpoint, so we update only changed
 * rows via `PUT /payrollmanagement/settings/:id` and send only changed fields.
 */
export async function updatePayrollSettings(data: PayrollSettingsBulkUpdateInput): Promise<void> {
  // 1) Update changed columns.
  // Prefer a true bulk endpoint if the backend supports it (single request),
  // otherwise fall back to per-id updates.
  if (Array.isArray(data.columns) && data.columns.length > 0) {
    try {
      // Backend expects a raw JSON array body.
      await api.put("/payrollmanagement/settings/bulk", data.columns)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Fallback for backends without bulk support (e.g. "Cannot PUT /api/v1/payrollmanagement/settings/bulk").
      if (/cannot put|not found|404/i.test(msg)) {
        await Promise.all(
          data.columns.map(({ id, ...patch }: PayrollSettingsBulkUpdateColumn) => api.put(`/payrollmanagement/settings/${id}`, patch)),
        )
      } else {
        throw err
      }
    }
  }

  // 2) Update Payroll Period only if included
  if (data.payrollBy) {
    await api.put("/setting/PAYROLL_TYPE", { value: payrollByToBackendValue(data.payrollBy) })
  }
}
