import React, { useMemo, useState, Fragment } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { 
  useGetCostPoolUsers, 
  useGetMaaEmployees,
  useGetMaaTcmActivityDepartments,
  useGetListAllPrograms,
  useGetUsersUnderDepartment,
  useGetTimeStudyProgramsForUsers,
  useGetRmtsPayPeriods,
} from "../queries/getDynamicFilters"
import type { ReportsModuleApi } from "../hooks/useReportsModule"
import { useGetDepartments } from "@/features/department/queries/getDepartments"
import { useCostPoolListQuery } from "@/features/cost-pool/queries/getCostPools"
import { useGetActivitiesByDepartment } from "@/features/CountyActivityCode/queries/getCountyActivityCodes"
import { useListFiscalYears } from "@/features/settings/queries/listFiscalYears"
import { useGetUserModuleRows } from "@/features/user/queries/getUsers"
import { CostPoolStatus } from "@/features/cost-pool/enums/cost-pool.enum"
import {
  REPORT_DOWNLOAD_TYPES,
  REPORT_FORM_DEFAULT_VALUES,
  REPORT_QUARTERS,
  reportDownloadFileNameSchema,
  reportFormSchema,
} from "../schemas"
import { getWeeksForQuarter } from "../utils/weeks"
import { ReportWeekCalendarPicker } from "./ReportWeekCalendarPicker"
import type {
  ReportEmployeeMultiSelectProps,
  ReportCatalogItem,
  ReportFormValues,
  ReportRunPayload,
  ReportSecondaryLayout,
  ReportSecondaryPickBlockProps,
  ReportSelectOption,
} from "../types"
import { mapReportFormToRunPayload } from "../utils/mapReportFormToRunPayload"
import { readStoredReportFormParams, writeStoredReportFormParams } from "../utils/reportFormSessionStorage"

const labelClassName = "mb-2 block text-[14px] font-normal text-[#2a2f3a]"


const selectTriggerBase =
  "!min-h-0 shrink-0 rounded-[8px] border border-[#d6d7dc] bg-white !text-[14px] font-normal leading-normal text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-0"

const reportSelectTrigger = cn(selectTriggerBase, "!h-12 w-full min-w-[162.83px] px-[11px] !py-0")

const yearQuarterSelectTrigger = cn(selectTriggerBase, "!h-12 w-full px-[11px] !py-0")


const departmentSelectTrigger = cn(selectTriggerBase, "!h-[47px] w-full min-w-0 px-[11px] !py-0")


const downloadTypeSelectTrigger = cn(selectTriggerBase, "!h-[45px] w-full px-[11px] !py-0")


const dateInputInRowClassName =
  "box-border h-12 w-full min-w-[112px] max-w-[168px] rounded-[8px] border border-[#d6d7dc] bg-white p-[9.29688px] text-[14px] text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3]/25"


const fileNameInputClassName =
  "h-[45px] w-full min-w-0 rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] py-0 text-[14px] text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3]/25"


const primaryReportButtonClass =
  "!h-[45px] !min-h-[45px] !w-[120px] shrink-0 rounded-[8px] !border-0 !bg-[#6C5DD3] !p-[4.46875px] !text-[14px] !font-medium !text-white hover:!bg-[#5b4fc2] focus-visible:!ring-2 focus-visible:!ring-[#6C5DD3]/35"


const stopReportButtonClass =
  "!h-[45px] !min-h-[45px] !w-[120px] shrink-0 rounded-[8px] !border-0 !bg-[#E73639] !p-[1.99219px] !text-[14px] !font-medium !text-white hover:!bg-[#cf2e31] focus-visible:!ring-2 focus-visible:!ring-[#E73639]/35"


const employeeMultiSelectClassName =
  "!h-[45px] !min-h-[45px] !max-h-[45px] w-full max-w-full min-w-0 overflow-hidden rounded-[8px] border border-[#dcd6f7] bg-white !py-0 !text-[14px] leading-normal text-[#111827] shadow-none focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3]/25 [&_.truncate]:!text-[14px]"

const reportEmployeeListPanelClassName =
  "rounded-[7px] border border-[#d9deea] bg-white shadow-[0_8px_18px_rgba(17,24,39,0.12)]"

const reportEmployeeListScrollClassName = "max-h-[240px] overflow-auto p-1"

/** Which secondary filters to show depends on the catalog report key (e.g. DSSRPTn). */
function getReportSecondaryLayout(criteria?: ReportCatalogItem["criteria"]): ReportSecondaryLayout {
  if (criteria) return "dynamic"
  return "employee"
}

function isTrue(val: unknown): boolean {
  return val === true || val === "true"
}

function mapIdNameRowsToSelectOptions(
  rows: readonly { id: string | number; name?: string; label?: string; code?: string }[],
): ReportSelectOption[] {
  const seen = new Set<string>()
  return [...rows]
    .map((row) => ({ 
      value: String(row.id), 
      label: row.label ?? row.name ?? String(row.id) 
    }))
    .filter((opt) => {
      if (seen.has(opt.value)) return false
      seen.add(opt.value)
      return true
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
}

function serializeEmployeeIdsField(values: readonly string[]): string {
  return values.join(", ")
}

function ReportEmployeeMultiSelect({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled = false,
  maxVisibleItems = 3,
  className,
  emptyListMessage = "No options available",
}: ReportEmployeeMultiSelectProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const selectedValues = useMemo(() => parseMultiSelectStoredValues(value), [value])
  const optionValues = useMemo(() => options.map((o) => o.value), [options])
  const allOptionsSelected =
    optionValues.length > 0 && optionValues.every((v) => selectedValues.includes(v))

  const selectedItems = useMemo(() => {
    return selectedValues.map((v) => {
      const opt = options.find((o) => o.value === v)
      return { value: v, label: opt?.label ?? v }
    })
  }, [selectedValues, options])

  const toggle = (v: string) => {
    const set = new Set(selectedValues)
    if (set.has(v)) set.delete(v)
    else set.add(v)
    onChange(serializeEmployeeIdsField([...set]))
  }

  const remove = (v: string) => {
    onChange(serializeEmployeeIdsField(selectedValues.filter((x) => x !== v)))
  }

  const toggleSelectAll = () => {
    if (allOptionsSelected) {
      onChange("")
      return
    }
    onChange(serializeEmployeeIdsField(optionValues))
  }

  const openMenuExplicit = () => {
    if (disabled) return
    setMenuOpen(true)
  }

  const hasSelection = selectedItems.length > 0

  return (
    <DropdownMenu modal={false} open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={placeholder}
          aria-disabled={disabled}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setMenuOpen((o) => !o)
            }
          }}
          className={cn(
            "relative z-10 flex w-full min-w-0 cursor-pointer flex-nowrap items-center gap-2 overflow-hidden rounded-[7px] border border-[#c6cedd] bg-white px-3 py-0 text-left shadow-none outline-none",
            "text-[14px] font-normal leading-[20px] text-[#111827]",
            "focus-visible:border-[#3b82f6] focus-visible:ring-1 focus-visible:ring-[#3b82f640]",
            disabled && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
            {selectedItems.length === 0 ? (
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#9ca3af]">{placeholder}</span>
            ) : (
              <>
                {selectedItems.slice(0, maxVisibleItems).map((a) => (
                  <span
                    key={a.value}
                    className="inline-flex max-w-[7.5rem] shrink-0 items-center gap-3 rounded-[2px] bg-[#eef0f5] px-1.5 py-0.5 text-[14px] text-[#111827]"
                  >
                    <span className="min-w-0 truncate">{a.label}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-[#6b7280]"
                      onPointerDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(a.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return
                        e.preventDefault()
                        e.stopPropagation()
                        remove(a.value)
                      }}
                      aria-label={`Remove ${a.label}`}
                    >
                      <X className="size-3" />
                    </span>
                  </span>
                ))}
                {selectedItems.length > maxVisibleItems ? (
                  <span className="inline-flex shrink-0 items-center rounded-[8px] bg-[#eef0f5] px-2 py-0.5 text-[14px] font-semibold tabular-nums text-[#111827]">
                    +{selectedItems.length - maxVisibleItems}
                  </span>
                ) : null}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center">
            {hasSelection ? (
              <span
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label="Open employee list"
                className={cn(
                  "inline-flex rounded p-1 text-[#6b7280] outline-none hover:bg-[#f3f4f6] focus-visible:ring-2 focus-visible:ring-[#6C5DD3]/40",
                  disabled && "pointer-events-none opacity-50",
                )}
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  openMenuExplicit()
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return
                  e.preventDefault()
                  e.stopPropagation()
                  openMenuExplicit()
                }}
              >
                <Search className="size-4" />
              </span>
            ) : (
              <ChevronDown className="size-4 shrink-0 text-[#6b7280]" aria-hidden />
            )}
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={6}
        className={cn("z-[90] w-[var(--radix-dropdown-menu-trigger-width)] p-0", reportEmployeeListPanelClassName)}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {options.length === 0 ? (
          <div className="px-3 py-2 text-[14px] text-[#6b7280]">{emptyListMessage}</div>
        ) : (
          <div className={reportEmployeeListScrollClassName}>
            <label
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 border-b border-[#e5e7eb] px-3 py-2.5 hover:bg-[#f3f4f8]",
                allOptionsSelected ? "bg-[#eef8ff]" : "bg-transparent",
              )}
            >
              <Checkbox
                checked={allOptionsSelected}
                onCheckedChange={() => toggleSelectAll()}
                className="shrink-0"
              />
              <span className="truncate text-[14px] font-medium text-[#111827]">Select All</span>
            </label>
            {options.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[#f3f4f8]",
                    selected ? "bg-[#eef8ff]" : "bg-transparent",
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggle(opt.value)}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-normal text-[#111827]">
                    {opt.label}
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ReportSecondaryPickBlock({
  control,
  title,
  activeLabel,
  inactiveLabel,
  activeField,
  inactiveField,
  idsField,
  options,
  placeholder,
  emptyListMessage,
  maxVisibleChips = 2,
}: ReportSecondaryPickBlockProps) {
  /* Padding on the positioned parent skewed `top-full`; keep pb on this outer wrapper only (pb-16 clears bar + mt-3). */
  return (
    <div className="w-full min-w-0 max-w-full pb-16">
      <div className="relative isolate w-full min-w-0 max-w-full">
        <div className="relative z-0 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="shrink-0 text-[14px] font-normal leading-none text-[#2a2f3a]">{title}</span>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-6">
            <Controller
              name={activeField}
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-[14px] leading-none text-[#111827]">
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="after:!hidden"
                  />
                  {activeLabel}
                </label>
              )}
            />
            <Controller
              name={inactiveField}
              control={control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2 text-[14px] leading-none text-[#111827]">
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(v) => field.onChange(v === true)}
                    className="after:!hidden"
                  />
                  {inactiveLabel}
                </label>
              )}
            />
          </div>
        </div>
        <div className="absolute left-0 right-0 top-full z-10 mt-4 min-w-0 w-full max-w-full">
          <Controller
            name={idsField}
            control={control}
            render={({ field }) => (
              <ReportEmployeeMultiSelect
                value={typeof field.value === "string" ? field.value : ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={options}
                placeholder={placeholder}
                maxVisibleItems={maxVisibleChips}
                className={employeeMultiSelectClassName}
                emptyListMessage={emptyListMessage}
              />
            )}
          />
        </div>
      </div>
    </div>
  )
}

function extensionForDownloadType(t: ReportFormValues["downloadType"]): string {
  if (t === "PDF") return "pdf"
  if (t === "Excel") return "xlsx"
  return "csv"
}

function saveBlobAsFile(blob: Blob, baseName: string, downloadType: ReportFormValues["downloadType"]) {
  const ext = extensionForDownloadType(downloadType)
  const lower = baseName.toLowerCase()
  const name = lower.endsWith(`.${ext}`) ? baseName : `${baseName}.${ext}`
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function asBlobResponse(payload: unknown): Blob | null {
  if (payload instanceof Blob) return payload
  return null
}

export type ReportFormProps = {
  module: ReportsModuleApi
}

export function ReportForm({ module }: ReportFormProps) {
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string>("")

  const updateReportPreview = (blob: Blob) => {
    setReportPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return URL.createObjectURL(blob)
    })
  }

  const defaultValues = useMemo((): ReportFormValues => {
    const stored = readStoredReportFormParams()
    if (!stored) return REPORT_FORM_DEFAULT_VALUES
    const merged: ReportFormValues = { ...REPORT_FORM_DEFAULT_VALUES, ...stored }
    const legacyId = (stored as { employeeId?: string }).employeeId
    if (!merged.employeeIds?.trim() && typeof legacyId === "string" && legacyId.trim() !== "") {
      merged.employeeIds = legacyId.trim()
    }
    return merged
  }, [])

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues,
    mode: "onTouched",
  })

  const { control, handleSubmit, setError, setValue, formState } = form
  const reportKey = useWatch({ control, name: "reportKey" }) ?? ""
  const selectMonthBy = useWatch({ control, name: "selectMonthBy" })
  const fiscalYearId = useWatch({ control, name: "fiscalYearId" }) ?? ""
  const quarter = useWatch({ control, name: "quarter" }) ?? ""
  const employeeIdsRaw = useWatch({ control, name: "employeeIds" }) ?? ""
  const employeeIds = useMemo(() => {
    if (!employeeIdsRaw) return []
    return employeeIdsRaw.split(",").map(s => s.trim()).filter(Boolean)
  }, [employeeIdsRaw])

  const dateFrom = useWatch({ control, name: "dateFrom" })
  const dateTo = useWatch({ control, name: "dateTo" })
  const monthVal = useWatch({ control, name: "month" })
  const yearVal = useWatch({ control, name: "year" })
  const weekIdVal = useWatch({ control, name: "weekId" })

  const { actualDateFrom, actualDateTo } = useMemo(() => {
    if (selectMonthBy === "dates") {
      return { actualDateFrom: dateFrom, actualDateTo: dateTo }
    }
    if (selectMonthBy === "month" && monthVal) {
      const [y, m] = monthVal.split("-")
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate()
      return {
        actualDateFrom: `${monthVal}-01`,
        actualDateTo: `${monthVal}-${String(lastDay).padStart(2, "0")}`,
      }
    }
    if (selectMonthBy === "year" && yearVal) {
      const [y1, y2] = yearVal.split("-")
      return {
        actualDateFrom: `${y1}-07-01`,
        actualDateTo: `${y2}-06-30`,
      }
    }
    if (selectMonthBy === "qtr" && fiscalYearId && quarter) {
      if (weekIdVal) {
        const parts = weekIdVal.split("|")
        if (parts.length === 2) {
          return { actualDateFrom: parts[0], actualDateTo: parts[1] }
        }
      }
      const [y1, y2] = fiscalYearId.split("-")
      let from = "", to = ""
      switch (quarter) {
        case "Qtr-1": from = `${y1}-07-01`; to = `${y1}-09-30`; break;
        case "Qtr-2": from = `${y1}-10-01`; to = `${y1}-12-31`; break;
        case "Qtr-3": from = `${y2}-01-01`; to = `${y2}-03-31`; break;
        case "Qtr-4": from = `${y2}-04-01`; to = `${y2}-06-30`; break;
      }
      return { actualDateFrom: from, actualDateTo: to }
    }
    return { actualDateFrom: undefined, actualDateTo: undefined }
  }, [selectMonthBy, dateFrom, dateTo, monthVal, yearVal, fiscalYearId, quarter, weekIdVal])

  const currentReportItem = useMemo(() => {
    return module.catalogItems.find((i) => i.key === reportKey)
  }, [reportKey, module.catalogItems])

  const secondaryLayout = useMemo(
    () => getReportSecondaryLayout(currentReportItem?.criteria),
    [currentReportItem],
  )

  const departmentId = useWatch({ control, name: "departmentId" })
  const activityIdsRaw = useWatch({ control, name: "activityIds" })
  const costPoolIdsRaw = useWatch({ control, name: "costPoolIds" })
  const { user } = useAuth()

  const activityIdsArr = useMemo(() => {
    if (!activityIdsRaw) return []
    return activityIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  }, [activityIdsRaw])

  const costPoolIdsArr = useMemo(() => {
    if (!costPoolIdsRaw) return []
    return costPoolIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  }, [costPoolIdsRaw])

  const isMaaReport = useMemo(() => reportKey.includes("MAA") || reportKey.includes("TCM"), [reportKey])
  const isCostPoolReport = useMemo(() => reportKey === "DSSRPT3" || reportKey === "DSSRPT4", [reportKey])

  const { data: maaEmployeesData } = useGetMaaEmployees(activityIdsArr, departmentId, isMaaReport)
  const { data: costPoolUsersData } = useGetCostPoolUsers(costPoolIdsArr, user?.id ?? "", ["active"], isCostPoolReport)
  const shouldFetchDepartmentUsers = !!departmentId && !isMaaReport && !isCostPoolReport
  const { data: departmentUsersData, isSuccess: isDepartmentUsersLoaded } = useGetUsersUnderDepartment(
    departmentId, 
    user?.id ?? "", 
    shouldFetchDepartmentUsers
  )
  const shouldFetchActivities = currentReportItem?.criteria?.showActivitySelect === true && !!departmentId
  const canFetchActivitiesForCurrentReport =
    shouldFetchActivities && (!shouldFetchDepartmentUsers || isDepartmentUsersLoaded)
  const { data: activitiesByDepartmentData } = useGetActivitiesByDepartment(
    canFetchActivitiesForCurrentReport ? Number(departmentId) : null,
  )

  const {
    viewReport,
    isViewPending,
    isViewError,
    viewError,
    stopViewReport,
    downloadReport,
    isDownloadPending,
    isDownloadError,
    downloadError,
    stopDownloadReport,
  } = module

  const reportOptions = useMemo(
    () => module.catalogItems.map((item) => ({ value: item.key, label: item.label })),
    [module.catalogItems],
  )

  const shouldFilterProgramsByUser = useMemo(() => {
    return isTrue(currentReportItem?.criteria?.filterProgramsByUser) || 
           (currentReportItem?.criteria?.showProgramSelect === true && employeeIds.length > 0)
  }, [currentReportItem, employeeIds])

  const { data: fiscalYearsData } = useListFiscalYears()
  const { data: departmentsData } = useGetDepartments({ status: "active", page: 1, limit: 100 })
  const { data: maaTcmDepartmentsData } = useGetMaaTcmActivityDepartments(isMaaReport)
  const { data: allProgramsData } = useGetListAllPrograms(
    currentReportItem?.criteria?.showProgramSelect === true && !shouldFilterProgramsByUser
  )
  const { data: costPoolsData } = useCostPoolListQuery(
    { costpoolStatus: CostPoolStatus.ACTIVE, page: 1, limit: 100 },
  )
  const { data: employeesData } = useGetUserModuleRows({ 
    inactiveOnly: false, 
    page: 1, 
    pageSize: 1000 
  })


  const { data: userSpecificPrograms } = useGetTimeStudyProgramsForUsers(
    employeeIds,
    actualDateFrom,
    actualDateTo,
    shouldFilterProgramsByUser && 
    employeeIds.length > 0 && 
    !!actualDateFrom && 
    !!actualDateTo,
  )

  const { data: rmtsPayPeriodsData } = useGetRmtsPayPeriods(
    fiscalYearId,
    departmentId,
    isTrue(currentReportItem?.criteria?.showTimeStudy) || selectMonthBy === "scheduled"
  )

  const timeStudyPeriodOptions = useMemo(() => {
    return rmtsPayPeriodsData ?? []
  }, [rmtsPayPeriodsData])

  const fiscalYearOptions = useMemo(
    () => (fiscalYearsData ? fiscalYearsData.map((fy) => ({ value: fy.id, label: fy.id })) : []),
    [fiscalYearsData],
  )

  const quarterOptions = useMemo(
    () => REPORT_QUARTERS.map((q) => ({ value: q, label: q })),
    [],
  )

  const departmentOptions = useMemo(() => {
    return (departmentsData?.items ? mapIdNameRowsToSelectOptions(departmentsData.items) : [])
  }, [departmentsData])

  const employeeOptions = useMemo(() => {
    // Create a base list from all loaded users
    const allUsers = employeesData?.items 
      ? mapIdNameRowsToSelectOptions(employeesData.items.map(u => ({ id: u.id, name: u.employee })))
      : []

    let specificList: ReportSelectOption[] | undefined = undefined

    if (reportKey.includes("MAA") || reportKey.includes("TCM")) {
      if (maaEmployeesData) specificList = maaEmployeesData
    } else if (reportKey === "DSSRPT3" || reportKey === "DSSRPT4") {
      if (costPoolUsersData) specificList = costPoolUsersData
    } else if (departmentId && departmentUsersData) {
      specificList = departmentUsersData
    }

    // If we have a specific list (like department users), merge it with the general list
    // to ensure labels are preserved for any previously selected employees.
    if (specificList) {
      const specificIds = new Set(specificList.map(o => o.value))
      const additional = allUsers.filter(o => !specificIds.has(o.value))
      return [...specificList, ...additional]
    }

    return allUsers
  }, [reportKey, maaEmployeesData, costPoolUsersData, departmentUsersData, departmentId, employeesData])

  const activityOptions = useMemo(() => {
    let baseList: ReportSelectOption[] = []
    if (isMaaReport && maaTcmDepartmentsData) {
      baseList = maaTcmDepartmentsData
    } else if (activitiesByDepartmentData) {
      baseList = mapIdNameRowsToSelectOptions(
        activitiesByDepartmentData.map((row) => ({
          id: row.id,
          name: row.name,
        })),
      )
    }

    // In a multi-select, we want to ensure any currently selected values have labels
    // even if they aren't in the primary filtered list (e.g. they belong to another dept).
    return baseList
  }, [
    isMaaReport,
    maaTcmDepartmentsData,
    activitiesByDepartmentData,
  ])

  const costPoolOptions = useMemo(() => {
    // costPoolsData from useCostPoolListQuery returns { data, meta }
    return costPoolsData?.data ? mapIdNameRowsToSelectOptions(costPoolsData.data) : []
  }, [costPoolsData])

  const programOptions = useMemo(() => {
    const all = allProgramsData ?? []
    const specific = userSpecificPrograms ?? []
    
    if (shouldFilterProgramsByUser) {
      // Prioritize user-specific but keep others for label resolution
      const specificIds = new Set(specific.map(o => o.value))
      const others = all.filter(o => !specificIds.has(o.value))
      return [...specific, ...others]
    }
    return all
  }, [allProgramsData, userSpecificPrograms, shouldFilterProgramsByUser])


  const downloadTypeOptions = useMemo(
    () => REPORT_DOWNLOAD_TYPES.map((t) => ({ value: t, label: t })),
    [],
  )
  
  const persistIfRequested = (values: ReportFormValues) => {
    if (values.retainParameters) {
      writeStoredReportFormParams(values)
    }
  }

  const onViewReport = handleSubmit((values) => {
    const payload: ReportRunPayload = mapReportFormToRunPayload(values)
    viewReport(payload, {
      onSuccess: (blobLike) => {
        const blob = asBlobResponse(blobLike)
        if (!blob) {
          toast.error("Report response is not a file. Please check selected report parameters.")
          return
        }
        updateReportPreview(blob)
        toast.success("Report loaded")
        persistIfRequested(values)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Could not load the report")
      },
    })
  })

  const onDownloadReport = handleSubmit((values) => {
    const parsedName = reportDownloadFileNameSchema.safeParse(values.fileName)
    if (!parsedName.success) {
      const msg = parsedName.error.issues[0]?.message ?? "Enter a file name"
      setError("fileName", { type: "manual", message: msg })
      return
    }

    const payload: ReportRunPayload = mapReportFormToRunPayload({
      ...values,
      fileName: parsedName.data,
    })

    downloadReport(payload, {
      onSuccess: (blobLike) => {
        const blob = asBlobResponse(blobLike)
        if (!blob) {
          toast.error("Download response is not a file. Please check selected report parameters.")
          return
        }
        if (values.downloadType === "PDF") {
          updateReportPreview(blob)
        }
        saveBlobAsFile(blob, parsedName.data, values.downloadType)
        toast.success("Download started")
        persistIfRequested(values)
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Download failed")
      },
    })
  })

  const onStop = () => {
    stopViewReport()
    stopDownloadReport()
    setReportPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return ""
    })
  }


  const catalogLoading = module.isCatalogPending

type ReportFiltersBodyProps = {
  control: any
  currentReportItem: any
  fiscalYearOptions: any[]
  quarterOptions: any[]
  labelClassName: string
  yearQuarterSelectTrigger: string
  dateInputInRowClassName: string
  setValue: any
  fiscalYearId: string | number
  quarter: string | number
  selectMonthBy: string
  formState: any
  timeStudyPeriodOptions: any[]
  departmentId: string | number
}

const ReportFiltersBody = ({
  control,
  currentReportItem,
  fiscalYearOptions,
  quarterOptions,
  labelClassName,
  yearQuarterSelectTrigger,
  dateInputInRowClassName,
  setValue,
  fiscalYearId,
  quarter,
  selectMonthBy,
  formState,
  timeStudyPeriodOptions,
  departmentId,
}: ReportFiltersBodyProps) => {
  return (
    <>
      <div className="flex shrink-0 items-end gap-4">
        <span className={labelClassName}>Select Month By</span>
        <Controller
          name="selectMonthBy"
          control={control}
          render={({ field }) => (
            <RadioGroup
              className="flex h-12 items-center gap-4"
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v as "qtr" | "dates" | "month" | "year" | "scheduled")
                if (v === "dates") {
                  const now = new Date()
                  const y = now.getFullYear()
                  const m = now.getMonth()
                  const fromStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
                  const qtrEndMonth = Math.floor(m / 3) * 3 + 2
                  const qtrEndDate = new Date(y, qtrEndMonth + 1, 0)
                  const toStr = `${y}-${String(qtrEndMonth + 1).padStart(2, "0")}-${String(qtrEndDate.getDate()).padStart(2, "0")}`
                  setValue("dateFrom", fromStr, { shouldValidate: true })
                  setValue("dateTo", toStr, { shouldValidate: true })
                }
              }}
            >
              {(() => {
                const criteria = currentReportItem?.criteria
                const monthByOpts = criteria?.showMonthBy?.map((o: any) => o.type)

                const showQtr = monthByOpts ? monthByOpts.includes("qtr") : (isTrue(criteria?.showQuarterSelect) || isTrue(criteria?.showQtr))
                const showDates = monthByOpts ? monthByOpts.includes("dates") : (isTrue(criteria?.showDate) || isTrue(criteria?.showDates))
                const showMonth = monthByOpts ? monthByOpts.includes("month") : (isTrue(criteria?.monthly) || isTrue(criteria?.showMonthly))
                const showYear = monthByOpts ? monthByOpts.includes("year") : isTrue(criteria?.showYear)

                return (
                  <>
                    {showQtr && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="qtr" id="reports-month-qtr" />
                        <Label htmlFor="reports-month-qtr" className="text-[14px] font-normal">
                          Qtr
                        </Label>
                      </div>
                    )}
                    {showDates && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="dates" id="reports-month-dates" />
                        <Label htmlFor="reports-month-dates" className="text-[14px] font-normal">
                          Dates
                        </Label>
                      </div>
                    )}
                    {showMonth && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="month" id="reports-month-only" />
                        <Label htmlFor="reports-month-only" className="text-[14px] font-normal">
                          Month
                        </Label>
                      </div>
                    )}
                    {showYear && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="year" id="reports-year-only" />
                        <Label htmlFor="reports-year-only" className="text-[14px] font-normal">
                          Year
                        </Label>
                      </div>
                    )}
                    {isTrue(criteria?.showScheduleTime) && (
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="scheduled" id="reports-scheduled-time" />
                        <Label htmlFor="reports-scheduled-time" className="text-[14px] font-normal">
                          Scheduled Time
                        </Label>
                      </div>
                    )}
                  </>
                )
              })()}
            </RadioGroup>
          )}
        />
      </div>

      {selectMonthBy === "qtr" ? (
        <>
          {!isTrue(currentReportItem?.criteria?.showScheduleTime) && (
            <div className="w-[152px] shrink-0">
              <label className={labelClassName} htmlFor="reports-fiscal-year">
                Year
              </label>
              <Controller
                name="fiscalYearId"
                control={control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={fiscalYearOptions}
                    placeholder="Select year"
                    className={yearQuarterSelectTrigger}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
              {formState.errors.fiscalYearId?.message ? (
                <p className="mt-1 text-[13px] text-red-500" role="alert">
                  {formState.errors.fiscalYearId.message}
                </p>
              ) : null}
            </div>
          )}

          <div className="w-[142px] shrink-0">
            <label className={labelClassName} htmlFor="reports-quarter">
              Qtr
            </label>
            <Controller
              name="quarter"
              control={control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={quarterOptions}
                  placeholder="Qtr"
                  className={yearQuarterSelectTrigger}
                  contentClassName="max-h-[220px]"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px] !font-normal"
                />
              )}
            />
            {formState.errors.quarter?.message ? (
              <p className="mt-1 text-[13px] text-red-500" role="alert">
                {formState.errors.quarter.message}
              </p>
            ) : null}
          </div>

          {(currentReportItem?.criteria?.showWeekSelect || reportKey === "P112") && (
            <div className="w-[240px] shrink-0">
              <label className={labelClassName} htmlFor="reports-week-picker">
                Week Picker
              </label>
              <Controller
                name="weekId"
                control={control}
                render={({ field }) => (
                  <ReportWeekCalendarPicker
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val)
                      if (val) {
                        const [start, end] = val.split("|")
                        setValue("dateFrom", start)
                        setValue("dateTo", end)
                      }
                    }}
                    fiscalYear={fiscalYearId}
                    quarter={quarter}
                  />
                )}
              />
            </div>
          )}
        </>
      ) : selectMonthBy === "year" ? (
        <>
          {!isTrue(currentReportItem?.criteria?.showScheduleTime) && (
            <div className="w-[180px] shrink-0">
              <label className={labelClassName} htmlFor="reports-year-input">
                Year
              </label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={fiscalYearOptions}
                    placeholder="Select Year"
                    className={yearQuarterSelectTrigger}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
              {formState.errors.year?.message ? (
                <p className="mt-1 text-[13px] text-red-500" role="alert">
                  {formState.errors.year.message}
                </p>
              ) : null}
            </div>
          )}
        </>
      ) : selectMonthBy === "month" ? (
        <div className="w-[180px] shrink-0">
          <label className={labelClassName} htmlFor="reports-month-input">
            Month
          </label>
          <Controller
            name="month"
            control={control}
            render={({ field }) => (
              <TitleCaseInput
                id="reports-month-input"
                type="month"
                className={dateInputInRowClassName}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {formState.errors.month?.message ? (
            <p className="mt-1 text-[13px] text-red-500" role="alert">
              {formState.errors.month.message}
            </p>
          ) : null}
        </div>
      ) : selectMonthBy === "scheduled" ? (
        <>
          <div className="w-[min(350px,40vw)] min-w-[200px] shrink-0">
            <label className={labelClassName} htmlFor="reports-time-study-period">
              Time Study Period
            </label>
            <Controller
              name="timeStudyPeriodId"
              control={control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={timeStudyPeriodOptions}
                  placeholder={departmentId && fiscalYearId ? "Select Time Study Period" : "Select fiscal year and department"}
                  className={yearQuarterSelectTrigger}
                  contentClassName="max-h-[220px]"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px] !font-normal"
                />
              )}
            />
          </div>
          <div className="w-[min(168px,22vw)] min-w-[120px] shrink-0">
            <label className={labelClassName} htmlFor="reports-date-from">
              Start Date
            </label>
            <Controller
              name="dateFrom"
              control={control}
              render={({ field }) => (
                <TitleCaseInput
                  id="reports-date-from"
                  type="date"
                  className={dateInputInRowClassName}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div className="w-[min(168px,22vw)] min-w-[120px] shrink-0">
            <label className={labelClassName} htmlFor="reports-date-to">
              End Date
            </label>
            <Controller
              name="dateTo"
              control={control}
              render={({ field }) => (
                <TitleCaseInput
                  id="reports-date-to"
                  type="date"
                  className={dateInputInRowClassName}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </>
      ) : (
        <>
          <div className="w-[min(168px,22vw)] min-w-[120px] shrink-0">
            <label className={labelClassName} htmlFor="reports-date-from">
              Start Date
            </label>
            <Controller
              name="dateFrom"
              control={control}
              render={({ field }) => (
                <TitleCaseInput
                  id="reports-date-from"
                  type="date"
                  className={dateInputInRowClassName}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {formState.errors.dateFrom?.message ? (
              <p className="mt-1 text-[13px] text-red-500" role="alert">
                {formState.errors.dateFrom.message}
              </p>
            ) : null}
          </div>
          <div className="w-[min(168px,22vw)] min-w-[120px] shrink-0">
            <label className={labelClassName} htmlFor="reports-date-to">
              End Date
            </label>
            <Controller
              name="dateTo"
              control={control}
              render={({ field }) => (
                <TitleCaseInput
                  id="reports-date-to"
                  type="date"
                  className={dateInputInRowClassName}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {formState.errors.dateTo?.message ? (
              <p className="mt-1 text-[13px] text-red-500" role="alert">
                {formState.errors.dateTo.message}
              </p>
            ) : null}
          </div>
        </>
      )}
    </>
  )
}


  return (

    <div className="w-full max-w-none rounded-[10px] border border-[#E5E7EB] bg-white px-[19px] pb-8 pt-5 shadow-sm sm:px-8 sm:pb-10 sm:pt-6">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Row 1: Reports + Department + period selection */}
        <div className="flex min-w-0 flex-wrap items-end gap-3 pb-0.5 sm:gap-4">
          <div className="w-[min(100%,240px)] min-w-[162.83px] shrink-0">
            <label className={labelClassName} htmlFor="reports-select-report">
              Reports
            </label>
            <Controller
              name="reportKey"
              control={control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val)
                    const item = module.catalogItems.find((i) => i.key === val)
                    const monthByOpts = item?.criteria?.showMonthBy?.map((o: any) => o.type)

                    if (monthByOpts && monthByOpts.length > 0) {
                      form.setValue("selectMonthBy", monthByOpts[0] as "qtr" | "dates" | "month" | "year")
                    } else if (isTrue(item?.criteria?.monthly) || isTrue(item?.criteria?.showMonthly)) {
                      form.setValue("selectMonthBy", "month")
                    } else if (isTrue(item?.criteria?.showYear)) {
                      form.setValue("selectMonthBy", "year")
                    } else if (isTrue(item?.criteria?.showQuarterSelect) || isTrue(item?.criteria?.showQtr)) {
                      form.setValue("selectMonthBy", "qtr")
                    } else if (isTrue(item?.criteria?.showDate) || isTrue(item?.criteria?.showDates)) {
                      form.setValue("selectMonthBy", "dates")
                    }
                    if (item) {
                      form.setValue("fileName", item.label)
                    }
                  }}
                  onBlur={field.onBlur}
                  options={reportOptions}
                  placeholder="Select Report"
                  disabled={catalogLoading}
                  isLoading={catalogLoading}
                  loadingLabel="Loading reports…"
                  className={reportSelectTrigger}
                  contentClassName="max-h-[220px]"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px] !font-normal"
                />
              )}
            />
            {formState.errors.reportKey?.message ? (
              <p className="mt-1 text-[13px] text-red-500" role="alert">
                {formState.errors.reportKey.message}
              </p>
            ) : null}
          </div>

          {isTrue(currentReportItem?.criteria?.showmasterCodes) && (
            <div className="min-w-0 w-full max-w-[350px] shrink-0">
              <label className={labelClassName} htmlFor="reports-master-code">
                Select Master Code
              </label>
              <Controller
                name="masterCode"
                control={control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={[
                      { value: "BOTH", label: "BOTH" },
                      { value: "MAA", label: "MAA" },
                      { value: "TCM", label: "TCM" },
                    ]}
                    placeholder="Select Master Code"
                    className={reportSelectTrigger}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
            </div>
          )}

          {currentReportItem?.criteria?.showDepartmentSelect !== false && (
            <div className="min-w-0 w-full max-w-[350px] shrink-0">
              <label className={labelClassName} htmlFor="reports-department">
                Department
              </label>
              <Controller
                name="departmentId"
                control={control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value ?? ""}
                    onChange={(val) => {
                      if ((field.value ?? "") !== val) {
                        setValue("employeeIds", "")
                        setValue("activityIds", "")
                        setValue("costPoolIds", "")
                        setValue("programIds", "")
                      }
                      field.onChange(val)
                    }}
                    onBlur={field.onBlur}
                    options={departmentOptions}
                    placeholder="Select Department"
                    className={departmentSelectTrigger}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
            </div>
          )}

          {isTrue(currentReportItem?.criteria?.showScheduleTime) && (
            <div className="w-[180px] shrink-0">
              <label className={labelClassName} htmlFor="reports-fiscal-year">
                Fiscal Year
              </label>
              <Controller
                name="fiscalYearId"
                control={control}
                render={({ field }) => (
                  <SingleSelectDropdown
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={fiscalYearOptions}
                    placeholder="Select Fiscal Year"
                    className={yearQuarterSelectTrigger}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
            </div>
          )}

          {!isTrue(currentReportItem?.criteria?.showScheduleTime) && (
            <ReportFiltersBody
              control={control}
              currentReportItem={currentReportItem}
              fiscalYearOptions={fiscalYearOptions}
              quarterOptions={quarterOptions}
              labelClassName={labelClassName}
              yearQuarterSelectTrigger={yearQuarterSelectTrigger}
              dateInputInRowClassName={dateInputInRowClassName}
              setValue={setValue}
              fiscalYearId={fiscalYearId}
              quarter={quarter}
              selectMonthBy={selectMonthBy}
              formState={formState}
              timeStudyPeriodOptions={timeStudyPeriodOptions}
              departmentId={departmentId}
            />
          )}
        </div>

        {isTrue(currentReportItem?.criteria?.showScheduleTime) && (
          <>
            <div className="pt-2">
              <p className="text-[14px] font-medium text-[#5e49e2] mb-1">Time Selection</p>
            </div>

            <div className="flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3 pb-0">
              <ReportFiltersBody
                control={control}
                currentReportItem={currentReportItem}
                fiscalYearOptions={fiscalYearOptions}
                quarterOptions={quarterOptions}
                labelClassName={labelClassName}
                yearQuarterSelectTrigger={yearQuarterSelectTrigger}
                dateInputInRowClassName={dateInputInRowClassName}
                setValue={setValue}
                fiscalYearId={fiscalYearId}
                quarter={quarter}
                selectMonthBy={selectMonthBy}
                formState={formState}
                timeStudyPeriodOptions={timeStudyPeriodOptions}
                departmentId={departmentId}
              />
            </div>
          </>
        )}
        {/* Row 2: secondary filters switch by report (DSSRPT1 → Employee+Activities, DSSRPT4 → Cost Pool+Employee, else Employee only). */}
        <div className="min-w-0 w-full pb-0">
          {secondaryLayout === "dynamic" && currentReportItem?.criteria ? (
            <div className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-y-0">
              {(() => {
                const { criteria } = currentReportItem
                const filterBlocks = [
                  {
                    id: "employee",
                    show: isTrue(criteria.multipleEmployees),
                    order: 1,
                    render: () => (
                      <ReportSecondaryPickBlock
                        control={control}
                        title="Employee"
                        activeLabel="Active Employee"
                        inactiveLabel="Inactive Employee"
                        activeField="includeActiveEmployees"
                        inactiveField="includeInactiveEmployees"
                        idsField="employeeIds"
                        options={employeeOptions}
                        placeholder="Select Employee"
                        emptyListMessage="No employees available"
                      />
                    ),
                  },
                  {
                    id: "program",
                    show: isTrue(criteria.showProgramSelect),
                    order: 2,
                    render: () => (
                      <ReportSecondaryPickBlock
                        control={control}
                        title="Program"
                        activeLabel="Active programs"
                        inactiveLabel="Inactive Programs"
                        activeField="includeActivePrograms"
                        inactiveField="includeInactivePrograms"
                        idsField="programIds"
                        options={programOptions}
                        placeholder="Select Program"
                        emptyListMessage="No programs available"
                      />
                    ),
                  },
                  {
                    id: "activity",
                    show: isTrue(criteria.showActivitySelect),
                    order: 3,
                    render: () => (
                      <ReportSecondaryPickBlock
                        control={control}
                        title="Activities"
                        activeLabel="Active Activities"
                        inactiveLabel="Inactive Activities"
                        activeField="includeActiveActivities"
                        inactiveField="includeInactiveActivities"
                        idsField="activityIds"
                        options={activityOptions}
                        placeholder="Select Activities"
                        emptyListMessage="No activities available"
                      />
                    ),
                  },
                  {
                    id: "costPool",
                    show: isTrue(criteria.showCostPoolSelect),
                    order: 4,
                    render: () => (
                      <ReportSecondaryPickBlock
                        control={control}
                        title="Cost Pool"
                        activeLabel="Active Cost Pool"
                        inactiveLabel="Inactive Cost Pool"
                        activeField="includeActiveCostPools"
                        inactiveField="includeInactiveCostPools"
                        idsField="costPoolIds"
                        options={costPoolOptions}
                        placeholder="Select Cost Pool"
                        emptyListMessage="No cost pools available"
                      />
                    ),
                  },
                ]

                return filterBlocks
                  .filter((b) => b.show)
                  .sort((a, b) => a.order - b.order)
                  .map((b) => <Fragment key={b.id}>{b.render()}</Fragment>)
              })()}
            </div>
          ) : (
            <div className="w-full max-w-xl">
               <ReportSecondaryPickBlock
                control={control}
                title="Employee"
                activeLabel="Active Employee"
                inactiveLabel="Inactive Employee"
                activeField="includeActiveEmployees"
                inactiveField="includeInactiveEmployees"
                idsField="employeeIds"
                options={employeeOptions}
                placeholder="Select Employee"
                emptyListMessage="No employees available"
              />
            </div>
          )}

        </div>

        {/* Row 3: Unapproved left; Retain + buttons flush right on one line */}
        <div className="-mt-1 flex min-h-[48px] flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-3">
          <div className="flex flex-wrap items-center gap-4">
            <Controller
              name="includeUnapprovedTime"
              control={control}
              render={({ field }) => (
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[14px] text-[#111827]">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Unapproved Time
                </label>
              )}
            />
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-2 sm:flex-nowrap">
            <Controller
              name="retainParameters"
              control={control}
              render={({ field }) => (
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[14px] text-[#111827]">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Retain Parameters
                </label>
              )}
            />
            <Button
              type="button"
              variant="default"
              className={primaryReportButtonClass}
              disabled={isViewPending}
              onClick={() => {
                void onViewReport()
              }}
            >
              {isViewPending ? (
                <>
                  <Loader2 className="mr-1 size-4 shrink-0 animate-spin" />
                  <span className="truncate">Loading…</span>
                </>
              ) : (
                "View Report"
              )}
            </Button>
            <Button type="button" variant="default" className={stopReportButtonClass} onClick={onStop}>
              Stop
            </Button>
          </div>
        </div>

        {isViewError && viewError instanceof Error ? (
          <p className="text-[14px] text-red-500" role="alert">
            {viewError.message}
          </p>
        ) : null}
        {isDownloadError && downloadError instanceof Error ? (
          <p className="text-[14px] text-red-500" role="alert">
            {downloadError.message}
          </p>
        ) : null}

        {/* Row 4: download row — narrow type, file name grows, button right */}
        <div className="flex min-w-0 flex-wrap items-end gap-4 pt-6">
          <div className="w-[120px] shrink-0">
            <label className={labelClassName} htmlFor="reports-download-type">
              Download Type
            </label>
            <Controller
              name="downloadType"
              control={control}
              render={({ field }) => (
                <SingleSelectDropdown
                  value={field.value}
                  onChange={(v) => field.onChange(v as ReportFormValues["downloadType"])}
                  onBlur={field.onBlur}
                  options={downloadTypeOptions}
                  placeholder="Format"
                  className={downloadTypeSelectTrigger}
                  contentClassName="max-h-[180px]"
                  itemButtonClassName="rounded-[6px] px-3 py-2"
                  itemLabelClassName="!text-[14px] !font-normal"
                />
              )}
            />
          </div>
          <div className=" flex-1 basis-0 w-full max-w-[350px] min-w-[350px]">
            <label className={labelClassName} htmlFor="reports-file-name">
              File Name
            </label>
            <Controller
              name="fileName"
              control={control}
              render={({ field }) => (
                <TitleCaseInput
                  id="reports-file-name"
                  placeholder="file name"
                  className={fileNameInputClassName}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {formState.errors.fileName?.message ? (
              <p className="mt-1 text-[13px] text-red-500" role="alert">
                {formState.errors.fileName.message}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="default"
            className={primaryReportButtonClass}
            disabled={isDownloadPending}
            onClick={() => {
              void onDownloadReport()
            }}
          >
            {isDownloadPending ? (
              <>
                <Loader2 className="mr-1 size-4 shrink-0 animate-spin" />
                <span className="truncate">Downloading…</span>
              </>
            ) : (
              "Download"
            )}
          </Button>
        </div>

        {reportPreviewUrl ? (
          <div className="pt-4">
            <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm">
              <iframe
                title="Report preview"
                src={reportPreviewUrl}
                className="h-[640px] w-full"
              />
            </div>
          </div>
        ) : null}
      </form>
    </div>
  )
}
