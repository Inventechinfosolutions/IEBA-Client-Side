import { Controller, useFormContext } from "react-hook-form"
import { useMemo } from "react"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
import { MultiSelectSearchDropdown } from "@/components/ui/multi-select-search-dropdown"
import { cn, sortSelectOptionsByLabel } from "@/lib/utils"
import type { SettingsFormValues } from "@/features/settings/types"
import {
  useSettingsDepartmentReports,
  useSettingsReportDepartments,
} from "@/features/settings/queries/getSettingsDepartmentReports"
import { useSettingsMasterCodes } from "@/features/settings/queries/getSettingsMasterCodes"
import { useMasterCodeActivities } from "@/features/settings/queries/getMasterCodeActivities"
import {
  previewActivityBuckets,
  previewMasterCodeBuckets,
  reassignActiveActivitiesForModeChange,
  reassignActiveMasterCodesForModeChange,
} from "@/features/reports/lib/reportMasterCodeData.utils"
import { ReportsExclusionSaveControls } from "@/features/settings/components/Reports/ReportsExclusionSaveControls"
import { SavedBucketPanel } from "@/features/settings/components/Reports/SavedBucketPanel"
import {
  clearReportBuckets,
  loadReportBucketsFromApiRow,
} from "@/features/settings/components/Reports/reportsForm.utils"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "!h-[38px] !w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
const activityMultiSelectClassName =
  "!min-h-[38px] !h-[38px] !w-[600px] !max-w-[600px] !rounded-[8px] !border-[#d6d7dc] !px-[11px] !py-0 !pr-9 !text-[12px] !font-normal !leading-normal overflow-hidden"

type ReportsFormProps = {
  isSaving?: boolean
  /** True when the Reports accordion section is expanded — loads departments. */
  isSectionOpen?: boolean
}

/**
 * Settings → Reports configuration.
 * - TanStack Query for API data (departments, mapped reports, master codes, activities).
 * - React Hook Form for state; no useEffect (hydration on dropdown / toggle handlers only).
 * - Summary panels use derived previews (useMemo), not live complement writes.
 */
export function ReportsForm({ isSaving = false, isSectionOpen = false }: ReportsFormProps) {
  const { control, watch, setValue, getValues } = useFormContext<SettingsFormValues>()

  const departmentId = watch("reports.departmentId") ?? ""
  const reportKey = watch("reports.reportKey") ?? ""
  const masterCodeExclusionMode = watch("reports.masterCodeExclusionMode")
  const activityExclusionMode = watch("reports.activityExclusionMode")
  const isMasterCodeIncludeMode = masterCodeExclusionMode === "include"
  const isActivityIncludeMode = activityExclusionMode === "include"

  const excludedMasterCodeIds = watch("reports.excludedMasterCodeIds") ?? []
  const includedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const excludedActivityCodes = watch("reports.excludedActivityCodes") ?? []
  const includedActivityCodes = watch("reports.includedActivityCodes") ?? []

  const masterCodeField = isMasterCodeIncludeMode
    ? ("reports.includedMasterCodeIds" as const)
    : ("reports.excludedMasterCodeIds" as const)
  const activityField = isActivityIncludeMode
    ? ("reports.includedActivityCodes" as const)
    : ("reports.excludedActivityCodes" as const)

  const { data: departmentsData, isLoading: isDeptsLoading } =
    useSettingsReportDepartments(isSectionOpen)
  const {
    data: departmentReportItems = [],
    isPending: isReportsPending,
    isFetching: isReportsFetching,
  } = useSettingsDepartmentReports(departmentId, isSectionOpen && !!departmentId)
  const reportsLoading = isReportsPending || isReportsFetching

  const {
    data: masterCodeOptions = [],
    isPending: isMasterCodesPending,
    isFetching: isMasterCodesFetching,
  } = useSettingsMasterCodes(isSectionOpen && !!reportKey)
  const masterCodesLoading = isMasterCodesPending || isMasterCodesFetching

  const masterCatalogIds = useMemo(
    () =>
      masterCodeOptions
        .map((o) => Number(o.value))
        .filter((n) => Number.isFinite(n) && n >= 1),
    [masterCodeOptions],
  )

  const includedMasterCodeIdsForActivities = useMemo(
    () =>
      previewMasterCodeBuckets(
        isMasterCodeIncludeMode ? "include" : "exclude",
        excludedMasterCodeIds,
        includedMasterCodeIds,
        masterCatalogIds,
      ).includedMasterCodeIds,
    [
      isMasterCodeIncludeMode,
      excludedMasterCodeIds,
      includedMasterCodeIds,
      masterCatalogIds,
    ],
  )

  const activitiesApiEnabled =
    Boolean(reportKey) && includedMasterCodeIdsForActivities.length > 0

  const {
    data: activityOptions = [],
    isPending: isActivitiesPending,
    isFetching: isActivitiesFetching,
  } = useMasterCodeActivities(
    includedMasterCodeIdsForActivities,
    activitiesApiEnabled && isSectionOpen,
  )
  const activitiesLoading = activitiesApiEnabled && (isActivitiesPending || isActivitiesFetching)

  const activityCatalogCodes = useMemo(
    () => activityOptions.map((o) => o.code),
    [activityOptions],
  )

  const activityPickerLabel = isActivityIncludeMode
    ? "Select Included Activities"
    : "Select Excluded Activities"
  const masterCodePickerLabel = isMasterCodeIncludeMode
    ? "Select Included Master Codes"
    : "Select Excluded Master Codes"

  const handleMasterCodeExclusionModeChange = (checked: boolean) => {
    const previousMode =
      getValues("reports.masterCodeExclusionMode") === "include" ? "include" : "exclude"
    const nextMode = checked ? "include" : "exclude"
    if (previousMode === nextMode) return

    const reassigned = reassignActiveMasterCodesForModeChange(
      previousMode,
      nextMode,
      getValues("reports.excludedMasterCodeIds") ?? [],
      getValues("reports.includedMasterCodeIds") ?? [],
    )
    setValue("reports.masterCodeExclusionMode", nextMode)
    setValue("reports.excludedMasterCodeIds", reassigned.excludedMasterCodeIds)
    setValue("reports.includedMasterCodeIds", reassigned.includedMasterCodeIds)
  }

  const handleActivityExclusionModeChange = (checked: boolean) => {
    const previousMode =
      getValues("reports.activityExclusionMode") === "include" ? "include" : "exclude"
    const nextMode = checked ? "include" : "exclude"
    if (previousMode === nextMode) return

    const reassigned = reassignActiveActivitiesForModeChange(
      previousMode,
      nextMode,
      getValues("reports.excludedActivityCodes") ?? [],
      getValues("reports.includedActivityCodes") ?? [],
    )
    setValue("reports.activityExclusionMode", nextMode)
    setValue("reports.excludedActivityCodes", reassigned.excludedActivityCodes)
    setValue("reports.includedActivityCodes", reassigned.includedActivityCodes)
  }

  const departmentOptions = sortSelectOptionsByLabel(
    (departmentsData?.items ?? []).map((d) => ({
      value: String(d.id),
      label: d.name ?? String(d.id),
    })),
  )

  const reportOptions = sortSelectOptionsByLabel(
    departmentReportItems.map((item) => ({ value: item.key, label: item.label })),
  )

  const masterCodeLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const opt of masterCodeOptions) {
      map.set(opt.value, opt.label)
    }
    return map
  }, [masterCodeOptions])

  const mapMasterCodeIdsToDisplay = (ids: string[]) =>
    ids.map((id) => ({
      code: id,
      label: masterCodeLabelById.get(id) ?? id,
    }))

  const masterCodeBucketPreview = useMemo(
    () =>
      previewMasterCodeBuckets(
        isMasterCodeIncludeMode ? "include" : "exclude",
        excludedMasterCodeIds,
        includedMasterCodeIds,
        masterCatalogIds,
      ),
    [
      isMasterCodeIncludeMode,
      excludedMasterCodeIds,
      includedMasterCodeIds,
      masterCatalogIds,
    ],
  )

  const excludedMasterCodesDisplay = mapMasterCodeIdsToDisplay(
    masterCodeBucketPreview.excludedMasterCodeIds,
  )
  const includedMasterCodesDisplay = mapMasterCodeIdsToDisplay(
    masterCodeBucketPreview.includedMasterCodeIds,
  )
  const masterCodeExcludedPanelHint = isMasterCodeIncludeMode
    ? "All other master codes (auto)"
    : "Your excluded selection"
  const masterCodeIncludedPanelHint = isMasterCodeIncludeMode
    ? "Your included selection"
    : "All other master codes (auto)"

  const showSavedBucketsSummary = Boolean(reportKey) && !masterCodesLoading

  const activityLabelByCode = useMemo(() => {
    const map = new Map<string, string>()
    for (const opt of activityOptions) {
      map.set(opt.code, opt.label)
    }
    return map
  }, [activityOptions])

  const mapActivityCodesToDisplay = (codes: string[]) =>
    codes.map((code) => ({
      code,
      label: activityLabelByCode.get(code) ?? code,
    }))

  const activityBucketPreview = useMemo(
    () =>
      previewActivityBuckets(
        isActivityIncludeMode ? "include" : "exclude",
        excludedActivityCodes,
        includedActivityCodes,
        activityCatalogCodes,
      ),
    [
      isActivityIncludeMode,
      excludedActivityCodes,
      includedActivityCodes,
      activityCatalogCodes,
    ],
  )

  const excludedActivitiesDisplay = mapActivityCodesToDisplay(
    activityBucketPreview.excludedActivityCodes,
  )
  const includedActivitiesDisplay = mapActivityCodesToDisplay(
    activityBucketPreview.includedActivityCodes,
  )
  const activityExcludedPanelHint = isActivityIncludeMode
    ? "All other activities (auto)"
    : "Your excluded selection"
  const activityIncludedPanelHint = isActivityIncludeMode
    ? "Your included selection"
    : "All other activities (auto)"

  const activityMultiSelectOptions = activityOptions.map((opt) => ({
    value: opt.code,
    label: opt.label,
  }))

  return (
    <div className="bg-transparent px-2 py-1">
      <div className="grid grid-cols-[260px_260px_260px_180px] items-start gap-2">
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
                    loadReportBucketsFromApiRow(
                      setValue,
                      report,
                      masterCatalogIds,
                      activityCatalogCodes,
                    )
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

        <div>
          <label className={labelClassName}>{masterCodePickerLabel}</label>
          <Controller
            key={masterCodeField}
            name={masterCodeField}
            control={control}
            render={({ field }) => (
              <MultiSelectSearchDropdown
                value={(field.value ?? []).join(", ")}
                onChange={(next) => {
                  const selected = parseMultiSelectStoredValues(next)
                  field.onChange(selected)
                  setValue("reports.excludedActivityCodes", [])
                  setValue("reports.includedActivityCodes", [])
                }}
                onBlur={field.onBlur}
                placeholder={masterCodePickerLabel}
                disabled={!reportKey || masterCodesLoading}
                isLoading={masterCodesLoading}
                loadingLabel="Loading master codes…"
                maxVisibleItems={2}
                options={masterCodeOptions}
                className={cn(
                  activityMultiSelectClassName,
                  "!w-[260px] !max-w-[260px] !min-h-[38px] !h-auto",
                  "[&_input]:!text-[12px] [&_span]:!text-[12px]",
                  (!reportKey || masterCodesLoading) && "cursor-not-allowed opacity-70",
                )}
              />
            )}
          />
        </div>

        <ReportsExclusionSaveControls
          control={control}
          modeField="reports.masterCodeExclusionMode"
          isSaving={isSaving}
          saveDisabled={isSaving || !departmentId || !reportKey}
          saveScope="masterCodes"
          onExclusionModeChange={handleMasterCodeExclusionModeChange}
        />
      </div>

      {showSavedBucketsSummary ? (
        <div className="mt-4 grid max-w-[1120px] grid-cols-2 gap-4">
          <SavedBucketPanel
            title="Excluded Master Codes"
            subtitle={masterCodeExcludedPanelHint}
            items={excludedMasterCodesDisplay}
          />
          <SavedBucketPanel
            title="Included Master Codes"
            subtitle={masterCodeIncludedPanelHint}
            items={includedMasterCodesDisplay}
          />
        </div>
      ) : null}

      <div className="mt-4 flex items-start gap-2">
        <div>
          <label className={labelClassName}>{activityPickerLabel}</label>
          <Controller
            key={activityField}
            name={activityField}
            control={control}
            render={({ field }) => (
              <MultiSelectSearchDropdown
                value={(field.value ?? []).join(", ")}
                onChange={(next) => {
                  const selected = parseMultiSelectStoredValues(next)
                  field.onChange(selected)
                }}
                onBlur={field.onBlur}
                placeholder={
                  !activitiesApiEnabled
                    ? "Save included master codes first"
                    : activityPickerLabel
                }
                disabled={!activitiesApiEnabled || !reportKey || activitiesLoading}
                isLoading={activitiesLoading}
                loadingLabel="Loading activities…"
                maxVisibleItems={2}
                options={activitiesApiEnabled ? activityMultiSelectOptions : []}
                className={cn(
                  activityMultiSelectClassName,
                  "!min-h-[38px] !h-auto",
                  "[&_input]:!text-[12px] [&_span]:!text-[12px] [&_button_span]:!text-[12px]",
                  (!activitiesApiEnabled || !reportKey || activitiesLoading) &&
                    "cursor-not-allowed opacity-70",
                )}
              />
            )}
          />
        </div>
        <ReportsExclusionSaveControls
          control={control}
          modeField="reports.activityExclusionMode"
          isSaving={isSaving}
          saveDisabled={isSaving || !departmentId || !reportKey}
          saveScope="activities"
          onExclusionModeChange={handleActivityExclusionModeChange}
        />
      </div>

      {showSavedBucketsSummary && activitiesApiEnabled ? (
        <div className="mt-4 grid max-w-[1120px] grid-cols-2 gap-4">
          <SavedBucketPanel
            title="Excluded Activities"
            subtitle={activityExcludedPanelHint}
            items={excludedActivitiesDisplay}
          />
          <SavedBucketPanel
            title="Included Activities"
            subtitle={activityIncludedPanelHint}
            items={includedActivitiesDisplay}
          />
        </div>
      ) : null}
    </div>
  )
}
