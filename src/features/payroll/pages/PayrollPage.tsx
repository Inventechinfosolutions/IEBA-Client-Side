import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { useDeletePayrollRows } from "../mutations/deletePayrollRows"
import { useUploadPayrollFile } from "../mutations/uploadPayrollFile"
import { PayrollDataTable } from "../components/PayrollDataTable"
import { EditPayrollDataDialog } from "../components/EditPayrollDataDialog"
import { PayrollDetailsSection } from "../components/PayrollDetailsSection"
import { PayrollUploadSection } from "../components/PayrollUploadSection"
import type { GetPayrollRowsParams, PayrollManagementRow, PayrollUploadFormValues } from "../types"
import { buildPayrollRowsXlsxBlob, triggerBrowserDownloadBlob } from "../utils/payrollCsv"
import { usePayrollFilterOptions } from "../hooks/usePayrollFilterOptions"
import { usePayrollRows } from "../hooks/usePayrollRows"
import { PayrollFrequency, type PayrollFrequencyType } from "../enums/payrollFrequency"
import { usePayrollSettings } from "@/features/settings/payroll"
import { cn } from "@/lib/utils"
import { updatePayrollRow } from "../api/payrollApi"

function mapSettingsPayrollByToPayrollType(payrollBy?: string): PayrollFrequencyType {
  const low = (payrollBy ?? "").toLowerCase().replace(/[^a-z]/g, "")
  if (low === "weekly") return PayrollFrequency.WEEKLY
  if (low === "monthly") return PayrollFrequency.MONTHLY
  if (low === "semimonthly") return PayrollFrequency.SEMI_MONTHLY
  if (low === "biweekly") return PayrollFrequency.BI_WEEKLY
  return PayrollFrequency.BI_WEEKLY
}

export function PayrollPage() {
  const filterModule = usePayrollFilterOptions()
  const [activeQueryParams, setActiveQueryParams] = useState<GetPayrollRowsParams | null>(null)
  const rowsModule = usePayrollRows(activeQueryParams)
  const payrollSettingsModule = usePayrollSettings()
  const uploadMutation = useUploadPayrollFile()
  const deleteMutation = useDeletePayrollRows()

  const enabledColumns = useMemo(
    () =>
      payrollSettingsModule.data?.columns
        ?.filter((c) => c.enabled)
        .map((c) => ({ label: c.label, editable: c.editable })) ?? [],
    [payrollSettingsModule.data?.columns],
  )

  const enabledColumnLabels = useMemo(
    () => enabledColumns.map((c) => c.label),
    [enabledColumns],
  )

  const settingsPayrollType = useMemo(
    () => mapSettingsPayrollByToPayrollType(payrollSettingsModule.data?.payrollBy),
    [payrollSettingsModule.data?.payrollBy],
  )
  const isPayrollTypeLocked = Boolean(payrollSettingsModule.data?.payrollBy)

  const hasAnyEditableEnabledColumn = enabledColumns.some((c) => c.editable)

  const [editRow, setEditRow] = useState<PayrollManagementRow | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editDialogKey, setEditDialogKey] = useState(0)

  const handleSubmitUpload = useCallback(
    (values: PayrollUploadFormValues, file: File | null) => {
      uploadMutation.mutate(
        { uploadType: values.uploadType, file },
        {
          onSuccess: () => {
            toast.success("Payroll file uploaded successfully.")
          },
          onError: (err: unknown) => {
            const message = err instanceof Error ? err.message : "Upload failed."
            toast.error(message)
          },
        },
      )
    },
    [uploadMutation],
  )

  const handleDownloadCurrentRows = useCallback(async () => {
    const blob = await buildPayrollRowsXlsxBlob(enabledColumnLabels, rowsModule.rows)
    triggerBrowserDownloadBlob("payroll-details-export.xlsx", blob)
  }, [enabledColumnLabels, rowsModule.rows])

  const handleDelete = useCallback(
    (params: GetPayrollRowsParams) => {
      const ids = rowsModule.rows
        .map((r) => (r as unknown as Record<string, unknown>)?.id)
        .filter((id): id is string | number => typeof id === "string" || typeof id === "number")

      if (ids.length === 0) {
        toast.error("No table rows have an id to delete.")
        return
      }

      deleteMutation.mutate({ params, rowIds: ids }, {
        onSuccess: () => {
          toast.success("Displayed payroll rows deleted successfully.")
        },
      })
    },
    [deleteMutation, rowsModule.rows],
  )

  const handleGetRows = useCallback((params: GetPayrollRowsParams) => {
    setActiveQueryParams(params)
    // Always force a refetch when clicking 'Get'
    setTimeout(() => {
      rowsModule.refetch()
    }, 0)
  }, [rowsModule])

  const handleEditRow = useCallback((row: PayrollManagementRow) => {
    setEditRow(row)
    setEditOpen(true)
  }, [])

  const handleSaveEdit = useCallback(async (patch: Record<string, string>) => {
    if (!editRow) return
    if (Object.keys(patch).length === 0) {
      toast.message("No changes to save.")
      return
    }

    const raw = editRow as unknown as Record<string, unknown>
    const rowId = (raw.id ?? raw.payrollmanagementid ?? raw.payrollManagementId) as string | number | undefined
    if (rowId === undefined || rowId === null || rowId === "") {
      toast.error("Unable to save: row id is missing from the payroll data response.")
      return
    }

    setIsSavingEdit(true)
    try {
      // Only send editable fields (modal only shows editable fields).
      await updatePayrollRow(rowId, patch)
      toast.success("Payroll row updated successfully.")
      // Refresh table data and keep modal open.
      const result = await rowsModule.refetch()
      const refreshed = (result.data ?? []) as readonly PayrollManagementRow[]
      const updatedRow =
        refreshed.find((r) => {
          const rr = r as unknown as Record<string, unknown>
          return String(rr.id ?? rr.payrollmanagementid ?? rr.payrollManagementId ?? "") === String(rowId)
        }) ?? null

      // If the updated row is present in the refreshed result, swap it in so the modal shows new values.
      // Otherwise keep the existing editRow (filters may not include this record).
      if (updatedRow) {
        setEditRow(updatedRow)
        // Remount dialog content to reset its internal field state to the refreshed row.
        setEditDialogKey((k) => k + 1)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed."
      toast.error(message)
    } finally {
      setIsSavingEdit(false)
    }
  }, [editRow, rowsModule])

  const isTableLoading = rowsModule.isLoading || rowsModule.isFetching
  const filterData = filterModule.data

  return (
    <section
      className="font-roboto *:font-roboto box-border w-full min-w-0 max-w-full overflow-x-hidden"
      style={{ "--primary": "#6C5DD3" } as React.CSSProperties}
    >
      <div className="box-border w-full min-w-0 max-w-full px-3 py-3">
        <div
          className={cn(
            "box-border mx-auto min-w-0 w-full max-w-full overflow-x-hidden rounded-[8px] border border-[#e7e9f2] bg-white",
            "shadow-[0_0_14px_0_rgb(0_0_0/0.04),0_0_1px_0_rgb(0_0_0/0.06)]",
          )}
        >
          <div className="flex min-w-0 w-full max-w-full flex-col gap-6 p-4 md:p-5">
            <div className="min-w-0 max-w-full">
              <h2 className="mb-3 text-[14px] font-semibold text-[#111827]">Payroll Upload:</h2>
              <PayrollUploadSection
                isUploading={uploadMutation.isPending}
                settingsPayrollType={settingsPayrollType}
                isPayrollTypeLocked={isPayrollTypeLocked}
                onSubmitUpload={handleSubmitUpload}
              />
            </div>

            {filterData ? (
              <div className="min-w-0 max-w-full">
                <h2 className="mb-3 text-[14px] font-semibold text-[#111827]">Payroll Details:</h2>
                <PayrollDetailsSection
                  filterOptions={filterData}
                  isOptionsLoading={filterModule.isLoading || filterModule.isFetching}
                  isRowsLoading={isTableLoading}
                  settingsPayrollType={settingsPayrollType}
                  isPayrollTypeLocked={isPayrollTypeLocked}
                  onGetRows={handleGetRows}
                  onDownloadCurrentRows={handleDownloadCurrentRows}
                  onDelete={handleDelete}
                  activeQueryParams={activeQueryParams}
                />
              </div>
            ) : (
              <div className="text-[14px] text-[#6b7280]">
                {filterModule.isLoading || filterModule.isFetching
                  ? "Loading payroll filters…"
                  : "Unable to load filters."}
              </div>
            )}

            <div className="min-w-0 max-w-full">
              <h2 className="mb-3 text-[14px] font-semibold text-[#111827]">Payroll data</h2>
              <PayrollDataTable
                rows={rowsModule.rows}
                isLoading={isTableLoading || payrollSettingsModule.isLoading || payrollSettingsModule.isFetching}
                columns={enabledColumnLabels}
                showEditAction={hasAnyEditableEnabledColumn}
                onEditRow={hasAnyEditableEnabledColumn ? handleEditRow : undefined}
              />
            </div>
          </div>
        </div>
      </div>

      <EditPayrollDataDialog
        key={editDialogKey}
        open={editOpen}
        onOpenChange={setEditOpen}
        row={editRow}
        columns={enabledColumns}
        isSaving={isSavingEdit}
        onSave={handleSaveEdit}
      />
    </section>
  )
}
