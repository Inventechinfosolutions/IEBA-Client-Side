import { useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { ReportsModuleApi } from "../hooks/useReportsModule"
import {
  filterReportMockRows,
  MOCK_ACTIVITIES,
  MOCK_COST_POOLS,
  MOCK_DEPARTMENT_OPTIONS,
  MOCK_EMPLOYEES,
  MOCK_FISCAL_YEAR_OPTIONS,
} from "../mock"
import {
  REPORT_DOWNLOAD_TYPES,
  REPORT_FORM_DEFAULT_VALUES,
  REPORT_QUARTERS,
  reportDownloadFileNameSchema,
  reportFormSchema,
} from "../schemas"
import type {
  ReportEmployeeMultiSelectProps,
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
function getReportSecondaryLayout(reportKey: string): ReportSecondaryLayout {
  const k = reportKey.trim()
  if (k === "DSSRPT1") return "employee-activities"
  if (k === "DSSRPT4") return "cost-pool-employee"
  return "employee"
}

function mapMockIdLabelRowsToSelectOptions(
  rows: readonly { id: string; label: string }[],
): ReportSelectOption[] {
  return [...rows]
    .map((row) => ({ value: row.id, label: row.label }))
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

function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank", "noopener,noreferrer")
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
}

export type ReportFormProps = {
  module: ReportsModuleApi
}

export function ReportForm({ module }: ReportFormProps) {
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

  const { control, handleSubmit, setError, formState } = form
  const reportKey = useWatch({ control, name: "reportKey" }) ?? ""
  const secondaryLayout = useMemo(() => getReportSecondaryLayout(reportKey), [reportKey])
  const selectMonthBy = useWatch({ control, name: "selectMonthBy" })
  const includeActiveEmployees = useWatch({ control, name: "includeActiveEmployees" })
  const includeInactiveEmployees = useWatch({ control, name: "includeInactiveEmployees" })
  const includeActiveActivities = useWatch({ control, name: "includeActiveActivities" })
  const includeInactiveActivities = useWatch({ control, name: "includeInactiveActivities" })
  const includeActiveCostPools = useWatch({ control, name: "includeActiveCostPools" })
  const includeInactiveCostPools = useWatch({ control, name: "includeInactiveCostPools" })

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

  const fiscalYearOptions = useMemo(
    () => MOCK_FISCAL_YEAR_OPTIONS.map((fy) => ({ value: fy.id, label: fy.label })),
    [],
  )

  const quarterOptions = useMemo(
    () => REPORT_QUARTERS.map((q) => ({ value: q, label: q })),
    [],
  )

  const departmentOptions = useMemo(
    () => MOCK_DEPARTMENT_OPTIONS.map((d) => ({ value: d.id, label: d.label })),
    [],
  )

  const employeeOptions = useMemo(() => {
    const rows = filterReportMockRows(MOCK_EMPLOYEES, includeActiveEmployees, includeInactiveEmployees)
    return mapMockIdLabelRowsToSelectOptions(rows)
  }, [includeActiveEmployees, includeInactiveEmployees])

  const activityOptions = useMemo(() => {
    const rows = filterReportMockRows(MOCK_ACTIVITIES, includeActiveActivities, includeInactiveActivities)
    return mapMockIdLabelRowsToSelectOptions(rows)
  }, [includeActiveActivities, includeInactiveActivities])

  const costPoolOptions = useMemo(() => {
    const rows = filterReportMockRows(MOCK_COST_POOLS, includeActiveCostPools, includeInactiveCostPools)
    return mapMockIdLabelRowsToSelectOptions(rows)
  }, [includeActiveCostPools, includeInactiveCostPools])

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
      onSuccess: (blob) => {
        openBlobInNewTab(blob)
        toast.success("Report opened in a new tab")
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
      onSuccess: (blob) => {
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
  }

  const catalogLoading = module.isCatalogPending

  return (
    <div className="w-full max-w-none rounded-[10px] border border-[#E5E7EB] bg-white px-[19px] pb-8 pt-5 shadow-sm sm:px-8 sm:pb-10 sm:pt-6">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Row 1: matches reference — one line, Department grows */}
        <div className="flex min-w-0 flex-nowrap items-end gap-3 sm:gap-4 overflow-x-auto pb-0.5">
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
                  onChange={field.onChange}
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

          <div className="shrink-0">
            <span className={labelClassName}>Select Month By</span>
            <Controller
              name="selectMonthBy"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  className="flex h-12 items-center gap-4"
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v as "qtr" | "dates")
                  }}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="qtr" id="reports-month-qtr" />
                    <Label htmlFor="reports-month-qtr" className="text-[14px] font-normal">
                      Qtr
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="dates" id="reports-month-dates" />
                    <Label htmlFor="reports-month-dates" className="text-[14px] font-normal">
                      Dates
                    </Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>

          {selectMonthBy === "qtr" ? (
            <>
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
                    <Input
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
                    <Input
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
                  onChange={field.onChange}
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
        </div>

        {/* Row 2: secondary filters switch by report (DSSRPT1 → Employee+Activities, DSSRPT4 → Cost Pool+Employee, else Employee only). */}
        <div className="min-w-0 w-full pb-0">
          {secondaryLayout === "employee" ? (
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
          ) : null}

          {secondaryLayout === "employee-activities" ? (
            <div className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-y-0">
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
            </div>
          ) : null}

          {secondaryLayout === "cost-pool-employee" ? (
            <div className="grid min-w-0 grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-y-0">
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
          ) : null}
        </div>

        {/* Row 3: Unapproved left; Retain + buttons flush right on one line */}
        <div className="-mt-1 flex min-h-[48px] flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-3">
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
                <Input
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
      </form>
    </div>
  )
}
