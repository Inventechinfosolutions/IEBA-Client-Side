import { useMemo, useRef, useState, type ReactNode } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { MultiSelectDropdown, parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
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
import { useGetClientMasterCodeTabs } from "@/features/master-code/queries/getClientMasterCodeTabs"
import { useGetClpppActivities, useGetClpppPrograms } from "@/features/reports/queries/getDynamicFilters"
import { useProgramOptions } from "@/features/settings/queries/getProgramOptions"
import { ReportsBucketTransfer } from "@/features/settings/components/Reports/ReportsBucketTransfer"
import { useReportsTransferSave } from "@/features/settings/components/Reports/useReportsTransferSave"
import {
  activityItemsToTransferItems,
  buildActivityTransferQueryParams,
  masterCodeRowToTransferItem,
} from "@/features/settings/components/Reports/reportsTransfer.utils"
import {
  clearReportBuckets,
  getReportHardCodedMappingNotes,
  isMcahTvtsReportKey,
  isReportsMappingReadOnlyKey,
  loadReportBucketsFromReportOption,
} from "@/features/settings/components/Reports/reportsForm.utils"
import type { ReportOption, ReportProgramItem } from "@/features/settings/types"
import { api } from "@/lib/api"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "!h-[38px] !w-full sm:!w-[260px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none placeholder:!text-[12px] focus-visible:border-[#6C5DD3] focus-visible:ring-0"

type McahCategoryField = "reports.category1Programs" | "reports.category2Programs" | "reports.category3Programs"

const MCAH_CATEGORY_FIELDS: Array<{
  field: McahCategoryField
  placeholder: string
}> = [
  {
    field: "reports.category1Programs",
    placeholder: "Select MCAH Category 1 Programs",
  },
  {
    field: "reports.category2Programs",
    placeholder: "Select MCAH Category 2 Programs",
  },
  {
    field: "reports.category3Programs",
    placeholder: "Select MCAH Category 3 Programs",
  },
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
  const { saveMasterCodes, saveActivities, savePrograms, ReportsTransferSaveTriggers } = transferSave ?? defaultTransferSave

  const watchedDepartmentId = watch("reports.departmentId") ?? ""
  const departmentId = (fixedDepartmentId?.trim() || watchedDepartmentId).trim()
  const reportKey = watch("reports.reportKey") ?? ""
  const isMcahReport = isMcahTvtsReportKey(reportKey)
  const isDepartmentLevel = Boolean(fixedDepartmentId?.trim())
  const isMappingReadOnly = isReportsMappingReadOnlyKey(reportKey, {
    departmentLevel: isDepartmentLevel,
  })

  const includedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const excludedMasterCodeIds = watch("reports.excludedMasterCodeIds") ?? []
  const includedActivityCodes = watch("reports.includedActivityCodes") ?? []
  const excludedActivityCodes = watch("reports.excludedActivityCodes") ?? []
  const category1Programs = watch("reports.category1Programs") ?? []
  const category2Programs = watch("reports.category2Programs") ?? []
  const category3Programs = watch("reports.category3Programs") ?? []

  const [masterCodeFetchMode, setMasterCodeFetchMode] = useState<ReportTransferBucketMode>("include")
  const [activityFetchMode, setActivityFetchMode] = useState<ReportTransferBucketMode>("include")
  const [isReportDetailLoading, setIsReportDetailLoading] = useState(false)
  const [mcahProgramCatalog, setMcahProgramCatalog] = useState<ReportProgramItem[]>([])
  const [isSavingClpppRouting, setIsSavingClpppRouting] = useState(false)
  const reportDetailRequestIdRef = useRef(0)
  const isClpppReport = String(reportKey).trim().toUpperCase() === "CLPPP"
  const clpppEligibleProgramCodes = watch("reports.clpppEligibleProgramCodes") ?? []
  const clpppNonClpppProgramCodes = watch("reports.clpppNonClpppProgramCodes") ?? ["*"]
  const clpppNonClpppActivityCodes = watch("reports.clpppNonClpppActivityCodes") ?? []
  const clpppPtoProgramCodes = watch("reports.clpppPtoProgramCodes") ?? ["*"]
  const programOptionsQuery = useProgramOptions(isSectionOpen && isClpppReport && !departmentId)
  const clpppProgramsQuery = useGetClpppPrograms(departmentId, isSectionOpen && isClpppReport && Boolean(departmentId))
  const clpppProgramIds = useMemo(
    () => (clpppProgramsQuery.data ?? []).map((program) => program.value).filter(Boolean),
    [clpppProgramsQuery.data],
  )
  const clpppActivitiesQuery = useGetClpppActivities(
    departmentId,
    clpppProgramIds,
    "active,inactive",
    isSectionOpen && isClpppReport && Boolean(departmentId) && clpppProgramIds.length > 0,
  )

  const masterCodePickerIds = masterCodeFetchMode === "include" ? includedMasterCodeIds : excludedMasterCodeIds

  const activityQueryParams = useMemo(
    () => buildActivityTransferQueryParams(activityFetchMode, includedActivityCodes, excludedActivityCodes),
    [activityFetchMode, includedActivityCodes, excludedActivityCodes],
  )

  const masterCodeNumericIds = useMemo(
    () => masterCodePickerIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n >= 1),
    [masterCodePickerIds],
  )

  const transferEnabled = isSectionOpen && Boolean(reportKey) && !isMcahReport && !isMappingReadOnly
  const hasMasterCodeScope = masterCodeNumericIds.length > 0
  const activitiesEnabled = transferEnabled && hasMasterCodeScope
  const hardCodedMappingNotes = useMemo(
    () =>
      getReportHardCodedMappingNotes(reportKey, {
        departmentLevel: isDepartmentLevel,
      }),
    [reportKey, isDepartmentLevel],
  )

  const {
    data: transferFlags,
    isPending,
    isFetching,
  } = useReportTransferFlags(
    {
      masterCodeMode: masterCodeFetchMode,
      selectedMasterCodeIds: masterCodeNumericIds,
      activityMode: activityQueryParams.queryActivityMode,
      selectedActivityCodes: activityQueryParams.selectedActivityCodes,
      excludedActivityCodes: activityQueryParams.excludedActivityCodes,
    },
    transferEnabled,
  )

  // Master-code panels only: limit to county active-tabs. Activities still use selected MCs as before.
  const activeTabsQuery = useGetClientMasterCodeTabs(transferEnabled)
  const activeTabNameSet = useMemo(() => {
    const names = activeTabsQuery.data ?? []
    return new Set(names.map((n) => n.trim()).filter(Boolean))
  }, [activeTabsQuery.data])
  const activeTabsReady = Array.isArray(activeTabsQuery.data)

  const isTransferLoading = transferEnabled && (isPending || isFetching || activeTabsQuery.isLoading || activeTabsQuery.isFetching)

  const unassignedMasterCodes = useMemo(() => {
    if (!activeTabsReady) return []
    return (transferFlags?.masterCodeFlag.excluded ?? [])
      .filter((row) => activeTabNameSet.has(String(row.name ?? "").trim()))
      .map(masterCodeRowToTransferItem)
  }, [transferFlags?.masterCodeFlag.excluded, activeTabNameSet, activeTabsReady])

  const assignedMasterCodes = useMemo(() => {
    if (!activeTabsReady) return []
    return (transferFlags?.masterCodeFlag.included ?? [])
      .filter((row) => activeTabNameSet.has(String(row.name ?? "").trim()))
      .map(masterCodeRowToTransferItem)
  }, [transferFlags?.masterCodeFlag.included, activeTabNameSet, activeTabsReady])

  // Activities unchanged — still scoped by the selected/assigned master codes above.

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

  const clpppProgramChoices = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>()
    if (departmentId) {
      for (const program of clpppProgramsQuery.data ?? []) {
        const code = program.code?.trim().toUpperCase()
        if (!code || options.has(code)) continue
        options.set(code, { value: code, label: program.label || code })
      }
    } else {
      for (const program of programOptionsQuery.data ?? []) {
        const code = String(program.code ?? "").trim().toUpperCase()
        if (!code || options.has(code)) continue
        const name = String(program.name ?? "").trim()
        options.set(code, { value: code, label: name && name !== code ? `(${code}) - ${name}` : code })
      }
    }
    return sortSelectOptionsByLabel([...options.values()])
  }, [clpppProgramsQuery.data, departmentId, programOptionsQuery.data])

  const clpppProgramOptions = useMemo(
    () => [{ value: "*", label: "All programs" }, ...clpppProgramChoices],
    [clpppProgramChoices],
  )

  const clpppActivityCodeOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>()
    for (const activity of clpppActivitiesQuery.data ?? []) {
      const code = activity.value.trim().toUpperCase()
      if (!code || options.has(code)) continue
      options.set(code, { value: code, label: activity.label || code })
    }
    for (const item of [...unassignedActivities, ...assignedActivities]) {
      const code = (item.code ?? item.id).trim().toUpperCase()
      if (!code || options.has(code)) continue
      options.set(code, { value: code, label: item.name || code })
    }
    for (const code of clpppNonClpppActivityCodes) {
      const value = code.trim().toUpperCase()
      if (value && !options.has(value)) options.set(value, { value, label: value })
    }
    return sortSelectOptionsByLabel([...options.values()])
  }, [assignedActivities, clpppActivitiesQuery.data, clpppNonClpppActivityCodes, unassignedActivities])

  const syncMcahIncludedExcludedFromCategories = (cat1: string[], cat2: string[], cat3: string[]) => {
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

    const stripFromOthers = (codes: string[]) => codes.filter((c) => !nextSet.has(c.trim().toUpperCase()))

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
    try {
      loadReportBucketsFromReportOption(setValue, report)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to read CLPPP routing settings")
    }
    const mode = report.type === "included" ? "include" : "exclude"
    setMasterCodeFetchMode(mode)
    setActivityFetchMode(mode)
    if (isMcahTvtsReportKey(report.key) || report.configKind === "programs") {
      const catalog = [...(report.programFlag?.included ?? []), ...(report.programFlag?.excluded ?? [])]
      setMcahProgramCatalog(catalog)
    } else {
      setMcahProgramCatalog([])
    }
  }

  const showDepartmentPicker = !fixedDepartmentId && !useCountyMappedReports
  // Exclusion/Inclusion toggle removed — mode is set from report config / defaults.

  const { data: departmentsData, isLoading: isDeptsLoading } = useSettingsReportDepartments(isSectionOpen && showDepartmentPicker)

  const deptReportsQuery = useSettingsDepartmentReports(departmentId, isSectionOpen && !useCountyMappedReports && !!departmentId)
  const countyReportsQuery = useSettingsCountyMappedReports(isSectionOpen && useCountyMappedReports)

  const reportItems = useCountyMappedReports ? (countyReportsQuery.data ?? []) : (deptReportsQuery.data ?? [])
  const isReportsPending = useCountyMappedReports ? countyReportsQuery.isPending : deptReportsQuery.isPending
  const isReportsFetching = useCountyMappedReports ? countyReportsQuery.isFetching : deptReportsQuery.isFetching

  const reportsLoading = useCountyMappedReports
    ? isSectionOpen && (isReportsPending || isReportsFetching)
    : Boolean(departmentId) && (isReportsPending || isReportsFetching)

  const departmentOptions = sortSelectOptionsByLabel(
    (departmentsData?.items ?? []).map((d) => ({
      value: String(d.id),
      label: d.name ?? String(d.id),
    })),
  )

  const reportOptions = sortSelectOptionsByLabel(reportItems.map((item) => ({ value: item.key, label: item.label })))

  const handleMasterCodeFetchModeChange = (direction: "assign" | "unassign") => {
    setMasterCodeFetchMode(direction === "assign" ? "include" : "exclude")
    setActivityFetchMode("include")
  }

  const handleActivityFetchModeChange = (direction: "assign" | "unassign") => {
    setActivityFetchMode(direction === "assign" ? "include" : "exclude")
  }

  const onClpppCodesChange = (
    field:
      | "reports.clpppEligibleProgramCodes"
      | "reports.clpppNonClpppProgramCodes"
      | "reports.clpppNonClpppActivityCodes"
      | "reports.clpppPtoProgramCodes",
    rawValue: string,
    allowAll: boolean,
  ) => {
    const selected = parseMultiSelectStoredValues(rawValue)
    if (!allowAll) {
      setValue(field, selected.filter((code) => code !== "*"))
      return
    }
    const currentSelection = getValues(field) ?? []
    const nextSelection = selected.includes("*")
      ? currentSelection.includes("*") && selected.length > 1
        ? selected.filter((code) => code !== "*")
        : ["*"]
      : selected
    setValue(field, nextSelection.length ? nextSelection : ["*"])
  }

  const saveClpppProgramRouting = async () => {
    if (isDepartmentLevel) {
      saveActivities("assign")
      return
    }
    const reportId = reportItems.find((item) => item.key.trim().toUpperCase() === "CLPPP")?.id
    if (!reportId) {
      toast.error("Unable to save CLPPP routing: report metadata is not available.")
      return
    }

    setIsSavingClpppRouting(true)
    try {
      const latestReport = await fetchSettingsReportById(reportId)
      if (!latestReport) {
        throw new Error("CLPPP report metadata could not be loaded.")
      }
      const criteria: Record<string, unknown> = latestReport.criteria?.trim() ? JSON.parse(latestReport.criteria) : {}
      if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
        throw new Error("CLPPP report criteria must be a JSON object.")
      }
      await api.put(`/report/${reportId}`, {
        criteria: JSON.stringify({
          ...criteria,
          eligibleProgramCodes: getValues("reports.clpppEligibleProgramCodes") ?? [],
          nonClpppProgramCodes: getValues("reports.clpppNonClpppProgramCodes") ?? ["*"],
          nonClpppActivityCodes: getValues("reports.clpppNonClpppActivityCodes") ?? [],
          ptoProgramCodes: getValues("reports.clpppPtoProgramCodes") ?? ["*"],
        }),
      })
      await queryClient.invalidateQueries({
        queryKey: [...settingsKeys.reports.detail(), reportId],
      })
      toast.success("CLPPP routing settings saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save CLPPP routing settings.")
    } finally {
      setIsSavingClpppRouting(false)
    }
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
                        const cacheKey = [...settingsKeys.reports.all(), "county-mapped-options"] as const
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
                        : "No county-mapped reports — map reports in Settings first"
                    : departmentId
                      ? reportsLoading
                        ? "Loading reports…"
                        : reportOptions.length
                          ? "Select report"
                          : "No department-mapped reports — assign reports in Department Report Setting first"
                      : "Select department first"
                }
                disabled={useCountyMappedReports ? !isSectionOpen || reportsLoading : !departmentId || reportsLoading}
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

      {reportKey && isMappingReadOnly ? (
        <div className="mt-6 space-y-2 rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]">
          {(() => {
            const key = String(reportKey).trim().toUpperCase()
            if (key === "DSSRPT5") {
              return (
                <>
                  <p className="font-medium">No report settings for this report.</p>
                  <p className="font-normal text-[#A16207]">
                    DSSRPT5 is payroll data only. There are no master-code or activity-code settings.
                  </p>
                </>
              )
            }
            if (key === "MAATCM" || key === "TCM_MAA_ADHOC") {
              return (
                <>
                  <p className="font-medium">No master-code mapping for this report.</p>
                  <p className="font-normal text-[#A16207]">
                    In the report UI you can only select activities. Master codes cannot be assigned or removed here.
                  </p>
                </>
              )
            }
            return (
              <>
                <p className="font-medium">Mapping is not editable for this report.</p>
                <p className="font-normal text-[#A16207]">
                  Master codes and activities are fixed by the system and cannot be assigned or removed here.
                </p>
              </>
            )
          })()}
          {hardCodedMappingNotes.length > 0 ? (
            <ul className="list-disc space-y-0.5 pl-4 font-normal text-[#A16207]">
              {hardCodedMappingNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {isClpppReport && !isMappingReadOnly ? (
        <section className="mt-6 space-y-3 rounded-[8px] border border-[#E5E7EB] bg-white p-4">
          <div>
            <h3 className="text-[13px] font-medium text-[#111827]">Layer 1 — Main report mapping</h3>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              Choose the programs whose activities stay on their own rows, then assign the FFP master code and activities below,
              including A, 11MB, and 11MF.
            </p>
          </div>
          <div className="max-w-[520px]">
            <label className={labelClassName}>Eligible programs</label>
            <MultiSelectDropdown
              value={clpppEligibleProgramCodes.join(", ")}
              onChange={(value) => onClpppCodesChange("reports.clpppEligibleProgramCodes", value, false)}
              onBlur={() => undefined}
              options={clpppProgramChoices}
              placeholder="Select eligible programs"
              disabled={isReportDetailLoading || isSaving || isSavingClpppRouting}
              isLoading={Boolean(departmentId) ? clpppProgramsQuery.isLoading : programOptionsQuery.isLoading}
              maxVisibleItems={2}
              className={cn(selectTriggerClassName, "!h-auto !min-h-[38px] !w-full py-1.5")}
            />
          </div>
        </section>
      ) : null}

      {reportKey && isMcahReport && !isMappingReadOnly ? (
        <div className="mt-6 flex flex-col gap-4">
          {isReportDetailLoading ? <p className="text-[12px] text-[#6B7280]">Loading programs…</p> : null}
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
                  className={cn(selectTriggerClassName, "!h-auto !min-h-[38px] !w-full sm:!w-[520px] py-1.5")}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      {reportKey && !isMcahReport && !isMappingReadOnly ? (
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

      {reportKey && !isMcahReport && !isMappingReadOnly && !hasMasterCodeScope && !isReportDetailLoading ? (
        <p className="mt-6 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-[12px] text-[#6B7280]">
          No activities yet. Assign at least one master code above, then save, to load and map activities for this report.
        </p>
      ) : null}

      {reportKey && !isMcahReport && !isMappingReadOnly && hasMasterCodeScope ? (
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

      {isClpppReport && !isMappingReadOnly ? (
        <section className="mt-6 space-y-4 rounded-[8px] border border-[#E5E7EB] bg-white p-4">
          <div>
            <h3 className="text-[13px] font-medium text-[#111827]">Layer 2 — Special activity mapping</h3>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              11B collects non-CLPPP time. Code 12 collects PTO. All programs is the default for both, and PTO stays on code 12
              unless you pick specific programs.
            </p>
          </div>
          {clpppProgramsQuery.isError || programOptionsQuery.isError ? (
            <p role="alert" className="text-[12px] text-red-600">
              Failed to load programs for CLPPP mapping.
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClassName}>11B — non-CLPPP programs</label>
              <MultiSelectDropdown
                value={clpppNonClpppProgramCodes.join(", ")}
                onChange={(value) => onClpppCodesChange("reports.clpppNonClpppProgramCodes", value, true)}
                onBlur={() => undefined}
                options={clpppProgramOptions}
                placeholder="Select programs for 11B"
                disabled={isReportDetailLoading || isSaving || isSavingClpppRouting}
                isLoading={Boolean(departmentId) ? clpppProgramsQuery.isLoading : programOptionsQuery.isLoading}
                maxVisibleItems={2}
                className={cn(selectTriggerClassName, "!h-auto !min-h-[38px] !w-full py-1.5")}
              />
            </div>
            <div>
              <label className={labelClassName}>11B — activity codes</label>
              <MultiSelectDropdown
                value={clpppNonClpppActivityCodes.join(", ")}
                onChange={(value) => onClpppCodesChange("reports.clpppNonClpppActivityCodes", value, false)}
                onBlur={() => undefined}
                options={clpppActivityCodeOptions}
                placeholder="Select activity codes for 11B"
                disabled={isReportDetailLoading || isSaving || isSavingClpppRouting}
                isLoading={clpppActivitiesQuery.isLoading}
                maxVisibleItems={2}
                className={cn(selectTriggerClassName, "!h-auto !min-h-[38px] !w-full py-1.5")}
              />
            </div>
            <div>
              <label className={labelClassName}>12 — programs whose PTO is included</label>
              <MultiSelectDropdown
                value={clpppPtoProgramCodes.join(", ")}
                onChange={(value) => onClpppCodesChange("reports.clpppPtoProgramCodes", value, true)}
                onBlur={() => undefined}
                options={clpppProgramOptions}
                placeholder="Select PTO programs"
                disabled={isReportDetailLoading || isSaving || isSavingClpppRouting}
                isLoading={Boolean(departmentId) ? clpppProgramsQuery.isLoading : programOptionsQuery.isLoading}
                maxVisibleItems={2}
                className={cn(selectTriggerClassName, "!h-auto !min-h-[38px] !w-full py-1.5")}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void saveClpppProgramRouting()}
            disabled={
              !reportItems.some((item) => item.key.trim().toUpperCase() === "CLPPP" && item.id) ||
              isReportDetailLoading ||
              isSavingClpppRouting ||
              isSaving
            }
            className="rounded-[6px] bg-[#6C5DD3] px-4 py-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingClpppRouting || isSaving ? "Saving…" : "Save CLPPP mapping"}
          </button>
        </section>
      ) : null}
    </div>
  )
}
