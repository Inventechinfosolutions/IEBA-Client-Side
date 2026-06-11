import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { cn, sortSelectOptionsByLabel } from "@/lib/utils"
import type { ReportTransferBucketMode } from "@/features/settings/components/Reports/reportsTransfer.api.types"
import type { SettingsFormValues } from "@/features/settings/types"
import {
  useSettingsDepartmentReports,
  useSettingsReportDepartments,
} from "@/features/settings/queries/getSettingsDepartmentReports"
import { useReportTransferFlags } from "@/features/settings/queries/getReportTransferFlags"
import { ActivityTransfer } from "@/features/settings/components/Reports/ActivityTransfer"
import { MasterCodeTransfer } from "@/features/settings/components/Reports/MasterCodeTransfer"
import { ReportsExclusionToggle } from "@/features/settings/components/Reports/ReportsExclusionSaveControls"
import { useReportsTransferSave } from "@/features/settings/components/Reports/useReportsTransferSave"
import {
  activityItemsToTransferItems,
  masterCodeRowToTransferItem,
} from "@/features/settings/components/Reports/reportsTransfer.utils"
import {
  clearReportBuckets,
  loadReportBucketsFromReportOption,
} from "@/features/settings/components/Reports/reportsForm.utils"
import {
  reassignActiveActivitiesForModeChange,
  reassignActiveMasterCodesForModeChange,
} from "@/features/reports/lib/reportMasterCodeData.utils"

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
 * Single GET /master-codes/activities returns masterCodeFlag + activityFlag.
 * Exclusion/Inclusion toggle drives masterCodeMode / activityMode on the API.
 */
export function ReportsForm({ isSaving = false, isSectionOpen = false }: ReportsFormProps) {
  const { control, watch, setValue, getValues } = useFormContext<SettingsFormValues>()
  const { saveMasterCodes, saveActivities, ReportsTransferSaveTriggers } = useReportsTransferSave()

  const departmentId = watch("reports.departmentId") ?? ""
  const reportKey = watch("reports.reportKey") ?? ""
  const masterCodeExclusionMode = watch("reports.masterCodeExclusionMode")
  const isIncludeMode = masterCodeExclusionMode === "include"

  const includedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const excludedMasterCodeIds = watch("reports.excludedMasterCodeIds") ?? []
  const includedActivityCodes = watch("reports.includedActivityCodes") ?? []
  const excludedActivityCodes = watch("reports.excludedActivityCodes") ?? []

  const [activityFetchMode, setActivityFetchMode] = useState<ReportTransferBucketMode>("include")

  const masterCodePickerIds = isIncludeMode ? includedMasterCodeIds : excludedMasterCodeIds
  const masterCodeMode: ReportTransferBucketMode = isIncludeMode ? "include" : "exclude"

  const activityPickerCodes =
    activityFetchMode === "include" ? includedActivityCodes : excludedActivityCodes

  const masterCodeNumericIds = useMemo(
    () =>
      masterCodePickerIds
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n >= 1),
    [masterCodePickerIds],
  )

  const transferEnabled = isSectionOpen && Boolean(reportKey)
  const hasMasterCodeScope = masterCodeNumericIds.length > 0
  const activitiesEnabled = transferEnabled && hasMasterCodeScope

  const { data: transferFlags, isPending, isFetching } = useReportTransferFlags(
    {
      masterCodeMode,
      selectedMasterCodeIds: masterCodeNumericIds,
      activityMode: activityFetchMode,
      selectedActivityCodes: activityPickerCodes,
      excludedActivityCodes:
        activityFetchMode === "include" ? excludedActivityCodes : includedActivityCodes,
    },
    transferEnabled,
  )

  const isTransferLoading = transferEnabled && (isPending || isFetching)

  const unassignedMasterCodes = useMemo(
    () => (transferFlags?.masterCodeFlag.excluded ?? []).map(masterCodeRowToTransferItem),
    [transferFlags?.masterCodeFlag.excluded],
  )

  const assignedMasterCodes = useMemo(
    () => (transferFlags?.masterCodeFlag.included ?? []).map(masterCodeRowToTransferItem),
    [transferFlags?.masterCodeFlag.included],
  )

  const unassignedActivities = useMemo(
    () => activityItemsToTransferItems(transferFlags?.activityFlag.excluded ?? []),
    [transferFlags?.activityFlag.excluded],
  )

  const assignedActivities = useMemo(
    () => activityItemsToTransferItems(transferFlags?.activityFlag.included ?? []),
    [transferFlags?.activityFlag.included],
  )

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

  const handleExclusionModeChange = (checked: boolean) => {
    const previousMode =
      getValues("reports.masterCodeExclusionMode") === "include" ? "include" : "exclude"
    const nextMode = checked ? "include" : "exclude"
    if (previousMode === nextMode) return

    const mcReassigned = reassignActiveMasterCodesForModeChange(
      previousMode,
      nextMode,
      getValues("reports.excludedMasterCodeIds") ?? [],
      getValues("reports.includedMasterCodeIds") ?? [],
    )
    const actReassigned = reassignActiveActivitiesForModeChange(
      previousMode,
      nextMode,
      getValues("reports.excludedActivityCodes") ?? [],
      getValues("reports.includedActivityCodes") ?? [],
    )

    setValue("reports.masterCodeExclusionMode", nextMode)
    setValue("reports.activityExclusionMode", nextMode)
    setValue("reports.excludedMasterCodeIds", mcReassigned.excludedMasterCodeIds)
    setValue("reports.includedMasterCodeIds", mcReassigned.includedMasterCodeIds)
    setValue("reports.excludedActivityCodes", actReassigned.excludedActivityCodes)
    setValue("reports.includedActivityCodes", actReassigned.includedActivityCodes)
    setActivityFetchMode(nextMode)
  }

  return (
    <div className="bg-transparent px-2 py-1">
      <ReportsTransferSaveTriggers />

      <div className="grid grid-cols-[260px_260px_180px] items-start gap-2">
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
                    setValue("reports.masterCodeExclusionMode", "exclude")
                    setValue("reports.activityExclusionMode", "exclude")
                    clearReportBuckets(setValue)
                    setActivityFetchMode("exclude")
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
                    const mode = report.type === "included" ? "include" : "exclude"
                    setActivityFetchMode(mode)
                  } else if ((field.value ?? "") !== val) {
                    clearReportBuckets(setValue)
                    setActivityFetchMode("exclude")
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

        <ReportsExclusionToggle
          control={control}
          disabled={!reportKey || isSaving}
          onExclusionModeChange={handleExclusionModeChange}
        />
      </div>

      {reportKey ? (
        <MasterCodeTransfer
          unassignedItems={unassignedMasterCodes}
          assignedItems={assignedMasterCodes}
          isLoading={isTransferLoading}
          isSaving={isSaving}
          disabled={!transferEnabled}
          onSave={saveMasterCodes}
        />
      ) : null}

      {reportKey && !hasMasterCodeScope ? (
        <p className="mt-6 text-[12px] text-[#6B7280]">
          Select at least one master code to load activities.
        </p>
      ) : null}

      {reportKey && hasMasterCodeScope ? (
        <ActivityTransfer
          key={`${reportKey}:${masterCodePickerIds.join(",")}:${masterCodeExclusionMode}`}
          unassignedItems={unassignedActivities}
          assignedItems={assignedActivities}
          isLoading={isTransferLoading}
          isSaving={isSaving}
          disabled={!activitiesEnabled}
          onSave={saveActivities}
          onActivityFetchModeChange={(direction) =>
            setActivityFetchMode(direction === "assign" ? "include" : "exclude")
          }
        />
      ) : null}
    </div>
  )
}
