import { useCallback, useState } from "react"
import { toast } from "sonner"

import { useDeletePayrollRows } from "../mutations/deletePayrollRows"
import { useUploadPayrollFile } from "../mutations/uploadPayrollFile"
import { PayrollDataTable } from "../components/PayrollDataTable"
import { PayrollDetailsSection } from "../components/PayrollDetailsSection"
import { PayrollUploadSection } from "../components/PayrollUploadSection"
import { PAYROLL_TABLE_TEMPLATE_HEADERS } from "../mock"
import type { GetPayrollRowsParams, PayrollUploadFormValues } from "../types"
import { buildPayrollRowsCsvContent, triggerBrowserDownloadTextFile } from "../utils/payrollCsv"
import { PAYROLL_CARD_SHADOW_CLASS } from "../constants"
import { usePayrollFilterOptions } from "../hooks/usePayrollFilterOptions"
import { usePayrollRows } from "../hooks/usePayrollRows"
import { cn } from "@/lib/utils"

export function PayrollPage() {
  const filterModule = usePayrollFilterOptions()
  const [activeQueryParams, setActiveQueryParams] = useState<GetPayrollRowsParams | null>(null)
  const rowsModule = usePayrollRows(activeQueryParams)
  const uploadMutation = useUploadPayrollFile()
  const deleteMutation = useDeletePayrollRows()

  const handleSubmitUpload = useCallback(
    (values: PayrollUploadFormValues, file: File | null) => {
      uploadMutation.mutate(
        { uploadType: values.uploadType, file },
        {
          onSuccess: () => {
            toast.success("Payroll file uploaded (mock).")
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

  const handleDownloadCurrentRows = useCallback(() => {
    const csv = buildPayrollRowsCsvContent(PAYROLL_TABLE_TEMPLATE_HEADERS, rowsModule.rows)
    triggerBrowserDownloadTextFile("payroll-details-export.csv", csv, "text/csv;charset=utf-8")
  }, [rowsModule.rows])

  const handleDelete = useCallback(
    (params: GetPayrollRowsParams) => {
      deleteMutation.mutate(params, {
        onSuccess: () => {
          toast.success("Payroll rows removed for the current filter (mock).")
        },
      })
    },
    [deleteMutation],
  )

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
            PAYROLL_CARD_SHADOW_CLASS,
          )}
        >
          <div className="flex min-w-0 w-full max-w-full flex-col gap-6 p-4 md:p-5">
            <div className="min-w-0 max-w-full">
              <h2 className="mb-3 text-[14px] font-semibold text-[#111827]">Payroll Upload:</h2>
              <PayrollUploadSection isUploading={uploadMutation.isPending} onSubmitUpload={handleSubmitUpload} />
            </div>

            {filterData ? (
              <div className="min-w-0 max-w-full">
                <h2 className="mb-3 text-[14px] font-semibold text-[#111827]">Payroll Details:</h2>
                <PayrollDetailsSection
                  filterOptions={filterData}
                  isOptionsLoading={filterModule.isLoading || filterModule.isFetching}
                  isRowsLoading={isTableLoading}
                  onGetRows={setActiveQueryParams}
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
              <PayrollDataTable rows={rowsModule.rows} isLoading={isTableLoading} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
