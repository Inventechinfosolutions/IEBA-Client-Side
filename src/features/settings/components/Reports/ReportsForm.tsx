import { Controller, useFormContext } from "react-hook-form"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { cn, sortSelectOptionsByLabel } from "@/lib/utils"
import type { SettingsFormValues } from "@/features/settings/types"
import {
  useSettingsDepartmentReports,
  useSettingsReportDepartments,
} from "@/features/settings/queries/getSettingsDepartmentReports"
import { ActivityTransfer } from "@/features/settings/components/Reports/ActivityTransfer"
import { MasterCodeTransfer } from "@/features/settings/components/Reports/MasterCodeTransfer"
import { useReportsTransferSave } from "@/features/settings/components/Reports/useReportsTransferSave"
import {
  clearReportBuckets,
  loadReportBucketsFromReportOption,
} from "@/features/settings/components/Reports/reportsForm.utils"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "!h-[38px] !w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-0"

type ReportsFormProps = {
  isSaving?: boolean
  /** True when the Reports accordion section is expanded — loads departments. */
  isSectionOpen?: boolean
}

/**
 * Settings → Reports configuration.
 * Assigned panel: GET …&mode=include (selectedIds / selectedCodes = assigned items).
 * Unassigned panel: GET …&mode=exclude (selectedIds / selectedCodes = unassigned items).
 * Assign / unassign via arrow buttons triggers save immediately.
 */
export function ReportsForm({ isSaving = false, isSectionOpen = false }: ReportsFormProps) {
  const { control, watch, setValue } = useFormContext<SettingsFormValues>()
  const { saveMasterCodes, saveActivities, ReportsTransferSaveTriggers } = useReportsTransferSave()

  const departmentId = watch("reports.departmentId") ?? ""
  const reportKey = watch("reports.reportKey") ?? ""

  const { data: departmentsData, isLoading: isDeptsLoading } =
    useSettingsReportDepartments(isSectionOpen)
  const {
    data: departmentReportItems = [],
    isPending: isReportsPending,
    isFetching: isReportsFetching,
  } = useSettingsDepartmentReports(departmentId, isSectionOpen && !!departmentId)
  const reportsLoading = isReportsPending || isReportsFetching

  const departmentOptions = sortSelectOptionsByLabel(
    (departmentsData?.items ?? []).map((d) => ({
      value: String(d.id),
      label: d.name ?? String(d.id),
    })),
  )

  const reportOptions = sortSelectOptionsByLabel(
    departmentReportItems.map((item) => ({ value: item.key, label: item.label })),
  )

  const transferEnabled = isSectionOpen && Boolean(reportKey)

  return (
    <div className="bg-transparent px-2 py-1">
      <ReportsTransferSaveTriggers />

      <div className="grid grid-cols-[260px_260px] items-start gap-2">
        <div>
          <label className={labelClassName}>Department</label>
          <Controller
            name="reports.departmentId"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? ""}
                onChange={(val) => {
                  if ((field.value ?? "") !== val) {
                    setValue("reports.reportKey", "")
                    setValue("reports.masterCodeExclusionMode", "include")
                    setValue("reports.activityExclusionMode", "include")
                    clearReportBuckets(setValue)
                  }
                  field.onChange(val)
                }}
                onBlur={field.onBlur}
                options={departmentOptions}
                placeholder="Select department"
                disabled={!isSectionOpen}
                isLoading={isSectionOpen && isDeptsLoading}
                loadingLabel="Loading departments…"
                className={cn(
                  selectTriggerClassName,
                  "!min-h-[38px] h-[38px] !text-[12px] disabled:cursor-not-allowed disabled:opacity-70",
                  "[&_span]:!text-[12px]",
                )}
                contentClassName="max-h-[180px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[12px] !font-normal"
              />
            )}
          />
        </div>

        <div>
          <label className={labelClassName}>Reports</label>
          <Controller
            name="reports.reportKey"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? ""}
                onChange={(val) => {
                  field.onChange(val)
                  const report = departmentReportItems.find((r) => r.key === val)
                  if (report) {
                    loadReportBucketsFromReportOption(setValue, report)
                  } else if ((field.value ?? "") !== val) {
                    clearReportBuckets(setValue)
                  }
                }}
                onBlur={field.onBlur}
                options={reportOptions}
                placeholder="Select report"
                disabled={!departmentId || reportsLoading}
                isLoading={reportsLoading}
                loadingLabel="Loading reports…"
                className={cn(
                  selectTriggerClassName,
                  "!min-h-[38px] h-[38px] !text-[12px] disabled:cursor-not-allowed disabled:opacity-70",
                  "[&_span]:!text-[12px]",
                )}
                contentClassName="max-h-[180px]"
                itemButtonClassName="rounded-[6px] px-3 py-2"
                itemLabelClassName="!text-[12px] !font-normal"
              />
            )}
          />
        </div>
      </div>

      {reportKey ? (
        <MasterCodeTransfer
          reportKey={reportKey}
          isSaving={isSaving}
          enabled={transferEnabled}
          onSave={saveMasterCodes}
        />
      ) : null}

      {reportKey ? (
        <ActivityTransfer
          reportKey={reportKey}
          isSaving={isSaving}
          enabled={transferEnabled}
          onSave={saveActivities}
        />
      ) : null}
    </div>
  )
}
