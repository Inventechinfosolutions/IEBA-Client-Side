import { useMemo, useRef, useState, type ReactNode } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import {
  MultiSelectDropdown,
  parseMultiSelectStoredValues,
} from "@/components/ui/multi-select-dropdown"
import { cn, sortSelectOptionsByLabel } from "@/lib/utils"
import type { ReportTransferBucketMode } from "@/features/settings/components/Reports/reportsTransfer.api.types"
import type { SettingsFormValues } from "@/features/settings/types"
import {
  fetchSettingsReportById,
  useSettingsCountyMappedReports,
  useSettingsDepartmentReports,
  useSettingsReportDepartments,
} from "@/features/settings/queries/getSettingsDepartmentReports"
import { fetchDepartmentReportConfigOption } from "@/features/department/queries/getDepartmentReportConfig"
import { departmentKeys } from "@/features/department/keys"
import { settingsKeys } from "@/features/settings/keys"
import { useQueryClient } from "@tanstack/react-query"
import { useReportTransferFlags } from "@/features/settings/queries/getReportTransferFlags"
import { ReportsBucketTransfer } from "@/features/settings/components/Reports/ReportsBucketTransfer"
import { ReportsExclusionToggle } from "@/features/settings/components/Reports/ReportsExclusionToggle"
import { useReportsTransferSave } from "@/features/settings/components/Reports/useReportsTransferSave"
import {
  activityItemsToTransferItems,
  buildActivityTransferQueryParams,
  masterCodeRowToTransferItem,
} from "@/features/settings/components/Reports/reportsTransfer.utils"
import {
  clearReportBuckets,
  isMcahTvtsReportKey,
  loadReportBucketsFromReportOption,
} from "@/features/settings/components/Reports/reportsForm.utils"
import {
  reassignActiveActivitiesForModeChange,
  reassignActiveMasterCodesForModeChange,
} from "@/features/reports/lib/reportMasterCodeData.utils"
import type { ReportOption, ReportProgramItem } from "@/features/settings/types"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "!h-[38px] !w-full sm:!w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-0"

type McahCategoryField =
  | "reports.category1Programs"
  | "reports.category2Programs"
  | "reports.category3Programs"

const MCAH_CATEGORY_FIELDS: Array<{
  field: McahCategoryField
  placeholder: string
}> = [
  { field: "reports.category1Programs", placeholder: "Select MCAH Category 1 Programs" },
  { field: "reports.category2Programs", placeholder: "Select MCAH Category 2 Programs" },
  { field: "reports.category3Programs", placeholder: "Select MCAH Category 3 Programs" },
]

type ReportsFormProps = {
  isSaving?: boolean
  /** True when the Reports accordion / tab is open — loads report catalogs. */
  isSectionOpen?: boolean
  /** When set, department is fixed (no dropdown) — used on Department → Reports mapping. */
  fixedDepartmentId?: string
  /** Load reports from county mapping instead of department.reportIds. */
  useCountyMappedReports?: boolean
  /** Optional save handlers (Department tab). Defaults to Settings form submit triggers. */
  transferSave?: {
    saveMasterCodes: (direction: "assign" | "unassign") => void
    saveActivities: (direction: "assign" | "unassign") => void
    savePrograms?: (direction: "assign" | "unassign") => void
    ReportsTransferSaveTriggers: () => ReactNode
  }
}

export function ReportsForm({
  isSaving = false,
  isSectionOpen = false,
  fixedDepartmentId,
  useCountyMappedReports = false,
  transferSave,
}: ReportsFormProps) {
  const queryClient = useQueryClient()
  const { control, watch, setValue, getValues } = useFormContext<SettingsFormValues>()
  const defaultTransferSave = useReportsTransferSave()
  const { saveMasterCodes, saveActivities, savePrograms, ReportsTransferSaveTriggers } =
    transferSave ?? defaultTransferSave

  const watchedDepartmentId = watch("reports.departmentId") ?? ""
  const departmentId = (fixedDepartmentId?.trim() || watchedDepartmentId).trim()
  const reportKey = watch("reports.reportKey") ?? ""
  const isMcahReport = isMcahTvtsReportKey(reportKey)

  const includedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const excludedMasterCodeIds = watch("reports.excludedMasterCodeIds") ?? []
  const includedActivityCodes = watch("reports.includedActivityCodes") ?? []
  const excludedActivityCodes = watch("reports.excludedActivityCodes") ?? []
  const category1Programs = watch("reports.category1Programs") ?? []
  const category2Programs = watch("reports.category2Programs") ?? []
  const category3Programs = watch("reports.category3Programs") ?? []

  const [masterCodeFetchMode, setMasterCodeFetchMode] =
    useState<ReportTransferBucketMode>("include")
  const [activityFetchMode, setActivityFetchMode] = useState<ReportTransferBucketMode>("include")
  const [isReportDetailLoading, setIsReportDetailLoading] = useState(false)
  const [mcahProgramCatalog, setMcahProgramCatalog] = useState<ReportProgramItem[]>([])
  const reportDetailRequestIdRef = useRef(0)

  const masterCodePickerIds =
    masterCodeFetchMode === "include" ? includedMasterCodeIds : excludedMasterCodeIds

  const activityQueryParams = useMemo(
    () =>
      buildActivityTransferQueryParams(
        activityFetchMode,
        includedActivityCodes,
        excludedActivityCodes,
      ),
    [activityFetchMode, includedActivityCodes, excludedActivityCodes],
  )

  const masterCodeNumericIds = useMemo(
    () =>
      masterCodePickerIds
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n >= 1),
    [masterCodePickerIds],
  )

  const transferEnabled = isSectionOpen && Boolean(reportKey) && !isMcahReport
  const hasMasterCodeScope = masterCodeNumericIds.length > 0
  const activitiesEnabled = transferEnabled && hasMasterCodeScope

  const { data: transferFlags, isPending, isFetching } = useReportTransferFlags(
    {
      masterCodeMode: masterCodeFetchMode,
      selectedMasterCodeIds: masterCodeNumericIds,
      activityMode: activityQueryParams.queryActivityMode,
      selectedActivityCodes: activityQueryParams.selectedActivityCodes,
      excludedActivityCodes: activityQueryParams.excludedActivityCodes,
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

  const mcahProgramOptions = useMemo(
    () =>
      sortSelectOptionsByLabel(
        mcahProgramCatalog
          .map((p) => {
            const code = String(p.code ?? "").trim()
            if (!code) return null
            const name = String(p.name ?? "").trim()
            return {
              value: code,
              label: name && name !== code ? `(${code}) - ${name}` : code,
            }
          })
          .filter((x): x is { value: string; label: string } => x != null),
      ),
    [mcahProgramCatalog],
  )

  const syncMcahIncludedExcludedFromCategories = (
    cat1: string[],
    cat2: string[],
    cat3: string[],
  ) => {
    const included = [...new Set([...cat1, ...cat2, ...cat3].map((c) => c.trim()).filter(Boolean))]
    const includedSet = new Set(included.map((c) => c.toUpperCase()))
    const excluded = mcahProgramCatalog
      .map((p) => String(p.code ?? "").trim())
      .filter((code) => code && !includedSet.has(code.toUpperCase()))
    setValue("reports.includedProgramCodes", included)
    setValue("reports.excludedProgramCodes", excluded)
  }

  const handleMcahCategoryChange = (field: McahCategoryField, rawValue: string) => {
    const nextCodes = parseMultiSelectStoredValues(rawValue)
    const nextSet = new Set(nextCodes.map((c) => c.toUpperCase()))

    let cat1 = [...(getValues("reports.category1Programs") ?? [])]
    let cat2 = [...(getValues("reports.category2Programs") ?? [])]
    let cat3 = [...(getValues("reports.category3Programs") ?? [])]

    const stripFromOthers = (codes: string[]) =>
      codes.filter((c) => !nextSet.has(c.trim().toUpperCase()))

    if (field === "reports.category1Programs") {
      cat1 = nextCodes
      cat2 = stripFromOthers(cat2)
      cat3 = stripFromOthers(cat3)
    } else if (field === "reports.category2Programs") {
      cat2 = nextCodes
      cat1 = stripFromOthers(cat1)
      cat3 = stripFromOthers(cat3)
    } else {
      cat3 = nextCodes
      cat1 = stripFromOthers(cat1)
      cat2 = stripFromOthers(cat2)
    }

    setValue("reports.category1Programs", cat1)
    setValue("reports.category2Programs", cat2)
    setValue("reports.category3Programs", cat3)
    syncMcahIncludedExcludedFromCategories(cat1, cat2, cat3)
    ;(savePrograms ?? saveMasterCodes)("assign")
  }

  const applyLoadedReportDetail = (full: ReportOption | null | undefined, fallback?: ReportOption) => {
    const report = full ?? fallback
    if (!report) return
    loadReportBucketsFromReportOption(setValue, report)
    const mode = report.type === "included" ? "include" : "exclude"
    setMasterCodeFetchMode(mode)
    setActivityFetchMode(mode)
    if (isMcahTvtsReportKey(report.key) || report.configKind === "programs") {
      const catalog = [
        ...(report.programFlag?.included ?? []),
        ...(report.programFlag?.excluded ?? []),
      ]
      setMcahProgramCatalog(catalog)
    } else {
      setMcahProgramCatalog([])
    }
  }

  const showDepartmentPicker = !fixedDepartmentId && !useCountyMappedReports

  const { data: departmentsData, isLoading: isDeptsLoading } =
    useSettingsReportDepartments(isSectionOpen && showDepartmentPicker)

  const deptReportsQuery = useSettingsDepartmentReports(
    departmentId,
    isSectionOpen && !useCountyMappedReports && !!departmentId,
  )
  const countyReportsQuery = useSettingsCountyMappedReports(
    isSectionOpen && useCountyMappedReports,
  )

  const reportItems = useCountyMappedReports
    ? (countyReportsQuery.data ?? [])
    : (deptReportsQuery.data ?? [])
  const isReportsPending = useCountyMappedReports
    ? countyReportsQuery.isPending
    : deptReportsQuery.isPending
  const isReportsFetching = useCountyMappedReports
    ? countyReportsQuery.isFetching
    : deptReportsQuery.isFetching

  const reportsLoading = useCountyMappedReports
    ? isSectionOpen && (isReportsPending || isReportsFetching)
    : Boolean(departmentId) && (isReportsPending || isReportsFetching)

  const departmentOptions = sortSelectOptionsByLabel(
    (departmentsData?.items ?? []).map((d) => ({
      value: String(d.id),
      label: d.name ?? String(d.id),
    })),
  )

  const reportOptions = sortSelectOptionsByLabel(
    reportItems.map((item) => ({ value: item.key, label: item.label })),
  )

  const handleExclusionModeChange = (checked: boolean) => {
    const previousMode =
      getValues("reports.masterCodeExclusionMode") === "include" ? "include" : "exclude"
    const nextMode = checked ? "include" : "exclude"
    if (previousMode === nextMode) return

    if (isMcahTvtsReportKey(getValues("reports.reportKey"))) {
      setValue("reports.masterCodeExclusionMode", nextMode)
      setValue("reports.activityExclusionMode", nextMode)
      syncMcahIncludedExcludedFromCategories(
        getValues("reports.category1Programs") ?? [],
        getValues("reports.category2Programs") ?? [],
        getValues("reports.category3Programs") ?? [],
      )
      setMasterCodeFetchMode(nextMode)
      setActivityFetchMode(nextMode)
      ;(savePrograms ?? saveMasterCodes)("assign")
      return
    }

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
    setMasterCodeFetchMode(nextMode)
    setActivityFetchMode(nextMode)
  }

  const handleMasterCodeFetchModeChange = (direction: "assign" | "unassign") => {
    setMasterCodeFetchMode(direction === "assign" ? "include" : "exclude")
    setActivityFetchMode("include")
  }

  const handleActivityFetchModeChange = (direction: "assign" | "unassign") => {
    setActivityFetchMode(direction === "assign" ? "include" : "exclude")
  }

  return (
    <div className="bg-transparent px-2 py-1">
      <ReportsTransferSaveTriggers />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
        {showDepartmentPicker ? (
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
                      setMasterCodeFetchMode("exclude")
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
        ) : null}

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
                  const report = reportItems.find((r) => r.key === val)
                  if (!report) {
                    clearReportBuckets(setValue)
                    setMasterCodeFetchMode("exclude")
                    setActivityFetchMode("exclude")
                    setMcahProgramCatalog([])
                    return
                  }

                  const modeHint = report.type === "included" ? "include" : "exclude"
                  setMasterCodeFetchMode(modeHint)
                  setActivityFetchMode(modeHint)
                  clearReportBuckets(setValue)
                  setMcahProgramCatalog([])

                  if (!report.id) {
                    applyLoadedReportDetail(report)
                    return
                  }

                  const deptId = departmentId
                  const requestId = ++reportDetailRequestIdRef.current
                  setIsReportDetailLoading(true)
                  // Department → Reports mapping: load config via TanStack (click → that API).
                  const loadDetail = fixedDepartmentId?.trim()
                    ? queryClient.fetchQuery({
                        queryKey: departmentKeys.reportSettings.config(deptId, report.id),
                        queryFn: () => fetchDepartmentReportConfigOption(deptId, report.id!),
                      })
                    : queryClient.fetchQuery({
                        queryKey: [...settingsKeys.reports.detail(), report.id] as const,
                        queryFn: () => fetchSettingsReportById(report.id!),
                      })

                  void loadDetail
                    .then((full) => {
                      if (requestId !== reportDetailRequestIdRef.current) return
                      if (!full) {
                        applyLoadedReportDetail(report)
                        return
                      }
                      if (useCountyMappedReports) {
                        const cacheKey = [
                          ...settingsKeys.reports.all(),
                          "county-mapped-options",
                        ] as const
                        queryClient.setQueryData(cacheKey, (prev: typeof reportItems | undefined) => {
                          const list = prev ?? []
                          return list.map((r) => (r.key === full.key ? { ...r, ...full } : r))
                        })
                      }
                      applyLoadedReportDetail(full, report)
                    })
                    .catch(() => {
                      if (requestId !== reportDetailRequestIdRef.current) return
                      applyLoadedReportDetail(report)
                    })
                    .finally(() => {
                      if (requestId !== reportDetailRequestIdRef.current) return
                      setIsReportDetailLoading(false)
                    })
                }}
                onBlur={field.onBlur}
                options={reportOptions}
                placeholder={
                  useCountyMappedReports
                    ? reportsLoading
                      ? "Loading reports…"
                      : reportOptions.length
                        ? "Select report"
                        : "No county-mapped reports"
                    : departmentId
                      ? reportsLoading
                        ? "Loading reports…"
                        : reportOptions.length
                          ? "Select report"
                          : "No department-mapped reports"
                      : "Select department first"
                }
                disabled={
                  useCountyMappedReports
                    ? !isSectionOpen || reportsLoading
                    : !departmentId || reportsLoading
                }
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
          disabled={!reportKey || isSaving || isReportDetailLoading}
          onExclusionModeChange={handleExclusionModeChange}
        />
      </div>

      {reportKey && isMcahReport ? (
        <div className="mt-6 flex flex-col gap-4">
          {isReportDetailLoading ? (
            <p className="text-[12px] text-[#6B7280]">Loading programs…</p>
          ) : null}
          {MCAH_CATEGORY_FIELDS.map(({ field, placeholder }) => {
            const selected =
              field === "reports.category1Programs"
                ? category1Programs
                : field === "reports.category2Programs"
                  ? category2Programs
                  : category3Programs
            return (
              <div key={field} className="w-full max-w-[520px]">
                <label className={labelClassName}>{placeholder}</label>
                <MultiSelectDropdown
                  value={selected.join(", ")}
                  onChange={(next) => handleMcahCategoryChange(field, next)}
                  onBlur={() => undefined}
                  options={mcahProgramOptions}
                  placeholder={placeholder}
                  disabled={!reportKey || isReportDetailLoading || isSaving}
                  isLoading={isReportDetailLoading}
                  maxVisibleItems={2}
                  className={cn(
                    selectTriggerClassName,
                    "!h-auto !min-h-[38px] !w-full sm:!w-[520px] py-1.5",
                  )}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      {reportKey && !isMcahReport ? (
        <ReportsBucketTransfer
          unassignedTitle="Unassigned Master Codes"
          assignedTitle="Assigned Master Codes"
          loadingLabel="Loading master codes…"
          includedField="reports.includedMasterCodeIds"
          excludedField="reports.excludedMasterCodeIds"
          clearActivitiesOnMove
          unassignedItems={unassignedMasterCodes}
          assignedItems={assignedMasterCodes}
          isLoading={isTransferLoading || isReportDetailLoading}
          isSaving={isSaving}
          disabled={!transferEnabled || isReportDetailLoading}
          onFetchModeChange={handleMasterCodeFetchModeChange}
          onSave={saveMasterCodes}
        />
      ) : null}

      {reportKey && !isMcahReport && !hasMasterCodeScope && !isReportDetailLoading ? (
        <p className="mt-6 text-[12px] text-[#6B7280]">
          Select at least one master code to load activities.
        </p>
      ) : null}

      {reportKey && !isMcahReport && hasMasterCodeScope ? (
        <ReportsBucketTransfer
          key={`${reportKey}:${masterCodePickerIds.join(",")}`}
          containerClassName="mt-6"
          unassignedTitle="Unassigned Activities"
          assignedTitle="Assigned Activities"
          loadingLabel="Loading activities…"
          includedField="reports.includedActivityCodes"
          excludedField="reports.excludedActivityCodes"
          unassignedItems={unassignedActivities}
          assignedItems={assignedActivities}
          isLoading={isTransferLoading || isReportDetailLoading}
          isSaving={isSaving}
          disabled={!activitiesEnabled || isReportDetailLoading}
          onFetchModeChange={handleActivityFetchModeChange}
          onSave={saveActivities}
        />
      ) : null}
    </div>
  )
}
