import { useMemo, useState, Fragment, useRef, useCallback } from "react"
import { useLocation } from "react-router-dom"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDown, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { parseMultiSelectStoredValues } from "@/components/ui/multi-select-dropdown"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn, sortFiscalYearSelectOptionsByLabel, sortSelectOptionsByLabel } from "@/lib/utils"
import {
  useGetCostPoolUsers,
  useGetMaaEmployees,
  useGetListAllPrograms,
  useGetUsersUnderDepartment,
  useGetTimeStudyProgramsForUsers,
  useGetRmtsPayPeriods,
  useGetActivitiesByDepartmentAndUsers,
  useGetCostPoolsByDepartment,
  useGetCheckDatesFromPayroll,
} from "../queries/getDynamicFilters"
import type { ReportsModuleApi } from "../hooks/useReportsModule"
import { useGetReportDepartments, useGetReportsByDepartment } from "../queries/getReports"
import { formatCountyDisplayName } from "@/features/department/lib/departmentReport.utils"
import { resolveCountyClientLogoSrc, useGetCountyClient, fetchClientForCurrentCounty, settingsCountyClientQueryKey } from "@/features/settings/queries/getCountyClient"
import { useQueryClient } from "@tanstack/react-query"
import { useListFiscalYears } from "@/features/settings/queries/listFiscalYears"
import {
  REPORT_DOWNLOAD_TYPES,
  REPORT_FORM_DEFAULT_VALUES,
  REPORT_QUARTERS,
  reportDownloadFileNameSchema,
  reportFormSchema,
} from "../schemas"
import { ReportWeekCalendarPicker } from "./ReportWeekCalendarPicker"
import { ReportMonthPicker } from "./ReportMonthPicker"
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
import { readStoredReportFormParams, writeStoredReportFormParams, clearStoredReportFormParams } from "../utils/reportFormSessionStorage"
import {
  resolveAllowedSelectMonthByValues,
  resolveDefaultSelectMonthBy,
  resolveReportMonthByFlags,
  resolveShowTopLevelFiscalYear,
} from "../lib/reportCatalog.utils"



/**
 * Progress bar driven by TanStack mutation's isPending — no useEffect.
 * Uses a callback ref to start/stop a requestAnimationFrame loop.
 * Percentage is computed from elapsed time (asymptotic curve → 95% over ~30s).
 */
function LoadingProgress({ isLoading }: { isLoading: boolean }) {
  const [pct, setPct] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Component just mounted → start the animation loop
      startRef.current = performance.now()
      const tick = () => {
        const elapsed = (performance.now() - startRef.current) / 1000
        // Asymptotic curve: fast start, slows down, caps at 95%
        const p = Math.min(95, 100 * (1 - Math.exp(-elapsed / 10)))
        setPct(Math.floor(p))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      // Component unmounting → cancel the loop
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!isLoading) return null

  return (
    <div ref={containerRef} className="space-y-2 pt-3 pb-2">
      <div className="flex items-center justify-between text-[13px] text-[#6b7280]">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3 animate-spin text-[#6C5DD3]" />
          <span>Generating report...</span>
        </div>
        <span className="font-semibold text-[#111827]">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        <div
          className="h-full rounded-full bg-[#6C5DD3] transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

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
  "rounded-[7px] border border-[#d9deea] bg-white dark:bg-[#18181b] dark:border-[rgba(108,93,211,0.4)] shadow-[0_8px_18px_rgba(17,24,39,0.12)]"

const reportEmployeeListScrollClassName = "max-h-[240px] overflow-auto p-1"

/** Which secondary filters to show depends on the catalog report key (e.g. DSSRPTn). */
function getReportSecondaryLayout(criteria?: ReportCatalogItem["criteria"]): ReportSecondaryLayout {
  if (criteria) return "dynamic"
  return "employee"
}

function isTrue(val: unknown): boolean {
  return val === true || val === "true"
}

function addDays(dateStr: string, days: number): string {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  if (isNaN(d.getTime())) return ""
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function mapIdNameRowsToSelectOptions(
  rows: readonly { id: string | number; name?: string; label?: string; code?: string }[],
): ReportSelectOption[] {
  const seen = new Set<string>()
  const opts = [...rows]
    .map((row) => ({
      value: String(row.id),
      label: row.label ?? row.name ?? String(row.id),
    }))
    .filter((opt) => {
      if (seen.has(opt.value)) return false
      seen.add(opt.value)
      return true
    })
  return sortSelectOptionsByLabel(opts)
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
  isLoading = false,
}: ReportEmployeeMultiSelectProps & { isLoading?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const disabledEffective = disabled || isLoading

  const selectedValues = useMemo(() => parseMultiSelectStoredValues(value), [value])
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchQuery])

  const filteredValues = useMemo(() => filteredOptions.map((o) => o.value), [filteredOptions])
  const allFilteredSelected =
    filteredValues.length > 0 && filteredValues.every((v) => selectedValues.includes(v))

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
    if (allFilteredSelected) {
      // Deselect only the filtered items
      const remaining = selectedValues.filter((v) => !filteredValues.includes(v))
      onChange(serializeEmployeeIdsField(remaining))
      return
    }
    // Add all filtered items to current selection
    const merged = new Set([...selectedValues, ...filteredValues])
    onChange(serializeEmployeeIdsField([...merged]))
  }

  const openMenuExplicit = () => {
    if (disabled) return
    setMenuOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setMenuOpen(open)
    if (!open) setSearchQuery("")
  }

  const hasSelection = selectedItems.length > 0

  return (
    <DropdownMenu modal={false} open={menuOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabledEffective}>
        <div
          role="button"
          tabIndex={disabledEffective ? -1 : 0}
          aria-label={placeholder}
          aria-disabled={disabledEffective}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (disabledEffective) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setMenuOpen((o) => !o)
            }
          }}
          className={cn(
            "relative z-10 flex w-full min-w-0 cursor-pointer flex-nowrap items-center gap-2 overflow-hidden rounded-[7px] border border-[#c6cedd] bg-white px-3 py-0 text-left shadow-none outline-none",
            "text-[14px] font-normal leading-[20px] text-[#111827]",
            "focus-visible:border-[#3b82f6] focus-visible:ring-1 focus-visible:ring-[#3b82f640]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-1.5 overflow-hidden">
            {isLoading ? (
              <span className="min-w-0 flex-1 truncate text-[14px] text-[#9ca3af]">Loading...</span>
            ) : selectedItems.length === 0 ? (
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
            {isLoading ? (
              <Spinner className="size-4 text-[#6C5DD3]" />
            ) : hasSelection ? (
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
        {/* Search input */}
        <div className="border-b border-[#e5e7eb] dark:border-[rgba(108,93,211,0.3)] px-3 py-2">
          <div className="flex items-center gap-2 rounded-[6px] border border-[#d6d7dc] dark:border-[#3f3f46] bg-[#f9fafb] dark:bg-[#09090b] px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-[#9ca3af]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#111827] dark:text-[#e4e4e7] placeholder-[#9ca3af] outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <span
                role="button"
                tabIndex={0}
                className="cursor-pointer text-[#9ca3af] hover:text-[#6b7280]"
                onClick={(e) => { e.stopPropagation(); setSearchQuery("") }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setSearchQuery("") } }}
              >
                <X className="size-3" />
              </span>
            )}
          </div>
        </div>

        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-[14px] text-[#6b7280]">
            {options.length === 0 ? emptyListMessage : "No matching results"}
          </div>
        ) : (
          <div className={reportEmployeeListScrollClassName}>
            <label
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 border-b border-[#e5e7eb] dark:border-[rgba(108,93,211,0.3)] px-3 py-2.5 hover:bg-[#f3f4f8] dark:hover:bg-[#2a1f52]",
                allFilteredSelected ? "bg-[#eef8ff] dark:bg-[#1c1538]" : "bg-transparent",
              )}
            >
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={() => toggleSelectAll()}
                className="shrink-0"
              />
              <span className="truncate text-[14px] font-medium text-[#111827] dark:text-[#e4e4e7]">Select All</span>
            </label>
            {filteredOptions.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-[#f3f4f8] dark:hover:bg-[#2a1f52]",
                    selected ? "bg-[#eef8ff] dark:bg-[#1c1538]" : "bg-transparent",
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggle(opt.value)}
                    className="shrink-0"
                  />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-normal text-[#111827] dark:text-[#e4e4e7]">
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
  onValuesChange,
  isLoading = false,
}: ReportSecondaryPickBlockProps & { isLoading?: boolean }) {
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
                onChange={(val) => {
                  field.onChange(val)
                  onValuesChange?.(val)
                }}
                onBlur={field.onBlur}
                options={options}
                placeholder={placeholder}
                maxVisibleItems={maxVisibleChips}
                className={employeeMultiSelectClassName}
                emptyListMessage={emptyListMessage}
                isLoading={isLoading}
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

function normalizeToDateInputValue(raw?: string): string | undefined {
  if (!raw) return undefined
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const mdy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw)
  if (mdy) return `${mdy[3]}-${mdy[1]}-${mdy[2]}`
  return undefined
}

export type ReportFormProps = {
  module: ReportsModuleApi
}

export function ReportForm({ module }: ReportFormProps) {
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string>("")
  const location = useLocation()

  const updateReportPreview = (blob: Blob) => {
    setReportPreviewUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl)
      }
      return URL.createObjectURL(blob)
    })
  }

  const navState = location.state as any
  const { user } = useAuth()
  const { data: countyClient } = useGetCountyClient(false)

  const isSuperAdmin = !!user?.permissions?.includes("superadmin:all")
  const { data: departmentsData, isLoading: isDeptsLoading } = useGetReportDepartments(user?.id, isSuperAdmin, true)

  const rawDepartmentOptions = useMemo(() => {
    return departmentsData?.items ? mapIdNameRowsToSelectOptions(departmentsData.items) : []
  }, [departmentsData])

  const [selectedDeptId, setSelectedDeptId] = useState<string>("")
  const {
    data: departmentReportItems = [],
    isPending: isDeptReportsPending,
    isFetching: isDeptReportsFetching,
  } = useGetReportsByDepartment(selectedDeptId, !!selectedDeptId)

  const formValues = useMemo((): ReportFormValues => {
    const stored = readStoredReportFormParams()
    const base = stored ? { ...REPORT_FORM_DEFAULT_VALUES, ...stored } : { ...REPORT_FORM_DEFAULT_VALUES }

    if (navState?.number) {
      base.reportKey = navState.number
    }
    if (navState?.filename) {
      base.fileName = navState.filename
    }

    const legacyId = (stored as { employeeId?: string })?.employeeId
    if (!base.employeeIds?.trim() && typeof legacyId === "string" && legacyId.trim() !== "") {
      base.employeeIds = legacyId.trim()
    }

    if (!base.departmentId && rawDepartmentOptions.length === 1) {
      base.departmentId = rawDepartmentOptions[0].value
    }

    const selectedItem = departmentReportItems.find((i) => i.key === base.reportKey)
    if (selectedItem?.criteria) {
      const allowed = resolveAllowedSelectMonthByValues(selectedItem.criteria)
      if (allowed.length > 0 && !allowed.includes(base.selectMonthBy)) {
        base.selectMonthBy = allowed[0]
      }
    }

    if (base.reportKey === "DSSRPT1" && base.dateFrom) {
      base.dateTo = addDays(base.dateFrom, 27)
    }

    return base
  }, [navState, rawDepartmentOptions, departmentReportItems])

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    values: formValues,
    resetOptions: {
      keepDirtyValues: true,
    },
    mode: "onTouched",
  })

  const { control, handleSubmit, setError, setValue, getValues, formState } = form

  const reportKey = useWatch({ control, name: "reportKey" }) ?? ""
  const departmentId = useWatch({ control, name: "departmentId" }) ?? ""

  if (departmentId !== selectedDeptId) {
    setSelectedDeptId(departmentId)
  }

  const hasSelectedReportType = reportKey.trim().length > 0
  const deptReportsLoading = !!departmentId && (isDeptReportsPending || isDeptReportsFetching)

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
  const masterCode = useWatch({ control, name: "masterCode" })

  const { actualDateFrom, actualDateTo } = useMemo(() => {
    if (selectMonthBy === "dates" || selectMonthBy === "scheduled") {
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
    return departmentReportItems.find((i) => i.key === reportKey)
  }, [reportKey, departmentReportItems])

  const secondaryLayout = useMemo(
    () => getReportSecondaryLayout(currentReportItem?.criteria),
    [currentReportItem],
  )

  const activityIdsRaw = useWatch({ control, name: "activityIds" })
  const costPoolIdsRaw = useWatch({ control, name: "costPoolIds" })
  const includeActiveEmployees = useWatch({ control, name: "includeActiveEmployees" })
  const includeInactiveEmployees = useWatch({ control, name: "includeInactiveEmployees" })
  const includeActiveActivities = useWatch({ control, name: "includeActiveActivities" })
  const includeInactiveActivities = useWatch({ control, name: "includeInactiveActivities" })
  const employeeStatusArr = useMemo(() => {
    const statuses: string[] = []
    if (includeActiveEmployees) statuses.push("active")
    if (includeInactiveEmployees) statuses.push("inactive")
    return statuses
  }, [includeActiveEmployees, includeInactiveEmployees])

  const activityStatusStr = useMemo(() => {
    const statuses: string[] = []
    if (includeActiveActivities) statuses.push("active")
    if (includeInactiveActivities) statuses.push("inactive")
    return statuses.join(",")
  }, [includeActiveActivities, includeInactiveActivities])

  const activityIdsArr = useMemo(() => {
    if (!activityIdsRaw) return []
    return activityIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  }, [activityIdsRaw])

  const costPoolIdsArr = useMemo(() => {
    if (!costPoolIdsRaw) return []
    return costPoolIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
  }, [costPoolIdsRaw])

  const criteria = currentReportItem?.criteria
  /** Reports screen always shows department first; criteria drives downstream filters only. */
  const showReportsDepartmentField = true
  const showProgramSelect = isTrue(criteria?.showProgramSelect)
  const showActivitySelect = criteria?.showActivitySelect === true
  const showScheduleTime = isTrue(criteria?.showScheduleTime)

  const isMaaReport = useMemo(() => reportKey.includes("MAA") || reportKey.includes("TCM"), [reportKey])
  const shouldShowCostPool = useMemo(
    () => isTrue(criteria?.showCostPoolSelect) || isTrue(criteria?.showCostPool),
    [criteria],
  )
  const showMasterCodes = isTrue(criteria?.showmasterCodes)

  const showTopLevelFiscalYear = resolveShowTopLevelFiscalYear(criteria)
  const topLevelFiscalYearLabel = "Fiscal Year"

  const shouldLoadFiscalYears =
    hasSelectedReportType &&
    (showTopLevelFiscalYear ||
      selectMonthBy === "qtr" ||
      selectMonthBy === "year" ||
      selectMonthBy === "scheduled" ||
      showScheduleTime)
  const shouldFetchCostPoolsByDepartment =
    hasSelectedReportType && shouldShowCostPool && !!departmentId
  const shouldFetchCostPoolUsers =
    shouldFetchCostPoolsByDepartment && !!user?.id && costPoolIdsArr.length > 0
  const shouldFetchDepartmentUsers =
    hasSelectedReportType &&
    !!departmentId &&
    !!user?.id &&
    (!isMaaReport || showMasterCodes) &&
    !shouldShowCostPool &&
    employeeStatusArr.length > 0

  const activityStartDate = useMemo(() => {
    if (!actualDateFrom) return undefined
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(actualDateFrom)
    return m ? `${m[2]}-${m[3]}-${m[1]}` : actualDateFrom
  }, [actualDateFrom])
  const activityEndDate = useMemo(() => {
    if (!actualDateTo) return undefined
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(actualDateTo)
    return m ? `${m[2]}-${m[3]}-${m[1]}` : actualDateTo
  }, [actualDateTo])
  const hasReportPeriodDates = !!activityStartDate && !!activityEndDate
  const shouldLoadDepartmentUsers =
    shouldFetchDepartmentUsers && (!showMasterCodes || hasReportPeriodDates)

  const shouldFetchMaaEmployees =
    hasSelectedReportType && isMaaReport && !!departmentId && !showMasterCodes
  const { data: maaEmployeesData, isFetching: isMaaEmployeesFetching } = useGetMaaEmployees(
    activityIdsArr,
    departmentId,
    shouldFetchMaaEmployees,
    reportKey,
  )
  const { data: costPoolUsersData, isFetching: isCostPoolUsersFetching } = useGetCostPoolUsers(
    costPoolIdsArr,
    user?.id ?? "",
    employeeStatusArr,
    shouldFetchCostPoolUsers,
    reportKey,
  )
  const { data: departmentUsersData, isFetching: isDeptUsersFetching } = useGetUsersUnderDepartment(
    departmentId,
    user?.id ?? "",
    showMasterCodes ? masterCode : undefined,
    employeeStatusArr,
    shouldLoadDepartmentUsers,
    reportKey,
    activityStartDate,
    activityEndDate,
  )

  const hasActivityDateRange = hasReportPeriodDates
  const shouldFetchActivities =
    hasSelectedReportType &&
    showActivitySelect &&
    !!departmentId &&
    employeeIds.length > 0 &&
    hasActivityDateRange
  const { data: activitiesByDepartmentData } = useGetActivitiesByDepartmentAndUsers(
    departmentId,
    employeeIds,
    activityStartDate,
    activityEndDate,
    activityStatusStr || "active",
    showMasterCodes ? masterCode : undefined,
    shouldFetchActivities,
    reportKey,
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
    () =>
      sortSelectOptionsByLabel(
        departmentReportItems.map((item) => ({
          value: item.key,
          label: item.label,
        })),
      ),
    [departmentReportItems],
  )

  const shouldFilterProgramsByUser = useMemo(() => {
    return (
      isTrue(criteria?.filterProgramsByUser) ||
      (showProgramSelect && employeeIds.length > 0)
    )
  }, [criteria, showProgramSelect, employeeIds])

  const shouldFetchAllPrograms =
    hasSelectedReportType && showProgramSelect && !shouldFilterProgramsByUser
  const shouldFetchUserPrograms =
    hasSelectedReportType &&
    showProgramSelect &&
    shouldFilterProgramsByUser &&
    !!departmentId &&
    employeeIds.length > 0 &&
    !!actualDateFrom &&
    !!actualDateTo
  const shouldFetchRmtsPayPeriods =
    hasSelectedReportType && selectMonthBy === "scheduled" && !!fiscalYearId && !!departmentId

  const { data: fiscalYearsData } = useListFiscalYears({
    enabled: shouldLoadFiscalYears,
    scopeKey: reportKey,
  })
  const { data: allProgramsData } = useGetListAllPrograms(shouldFetchAllPrograms, reportKey)
  const { data: costPoolsByDepartmentData, isFetching: isCostPoolsByDeptFetching } =
    useGetCostPoolsByDepartment(departmentId, shouldFetchCostPoolsByDepartment, reportKey)

  const { data: userSpecificPrograms } = useGetTimeStudyProgramsForUsers(
    employeeIds,
    actualDateFrom,
    actualDateTo,
    shouldFetchUserPrograms,
    reportKey,
  )

  const { data: rmtsPayPeriodsData } = useGetRmtsPayPeriods(
    fiscalYearId,
    departmentId,
    shouldFetchRmtsPayPeriods,
    reportKey,
  )

  const shouldFetchCheckDates = reportKey === "DSSRPT5" && !!departmentId && !!actualDateFrom && !!actualDateTo
  const { data: checkDatesData, isFetching: isCheckDatesFetching } = useGetCheckDatesFromPayroll(
    departmentId,
    actualDateFrom,
    actualDateTo,
    shouldFetchCheckDates,
    reportKey,
  )

  const checkDateOptions = useMemo(() => {
    return checkDatesData ? sortSelectOptionsByLabel(checkDatesData) : []
  }, [checkDatesData])

  const timeStudyPeriodOptions = useMemo(() => {
    return sortSelectOptionsByLabel(rmtsPayPeriodsData ?? [])
  }, [rmtsPayPeriodsData])

  const fiscalYearOptions = useMemo(
    () =>
      fiscalYearsData
        ? sortFiscalYearSelectOptionsByLabel(
            fiscalYearsData.map((fy) => ({ value: fy.id, label: fy.id })),
          )
        : [],
    [fiscalYearsData],
  )

  const quarterOptions = useMemo(
    () => REPORT_QUARTERS.map((q) => ({ value: q, label: q })),
    [],
  )

  const departmentOptions = useMemo(() => {
    if (reportKey === "P110-SS") {
      return rawDepartmentOptions.filter((opt) => opt.label === "Social Services")
    }
    return rawDepartmentOptions
  }, [rawDepartmentOptions, reportKey])

  const employeeOptions = useMemo(() => {
    if (shouldFetchCostPoolUsers && costPoolUsersData) {
      return sortSelectOptionsByLabel(costPoolUsersData)
    }
    if (departmentId && departmentUsersData) {
      return sortSelectOptionsByLabel(departmentUsersData)
    }
    if ((reportKey.includes("MAA") || reportKey.includes("TCM")) && maaEmployeesData) {
      return sortSelectOptionsByLabel(maaEmployeesData)
    }
    return []
  }, [shouldFetchCostPoolUsers, costPoolUsersData, departmentId, departmentUsersData, reportKey, maaEmployeesData])

  const isEmployeeLoading =
    (shouldFetchCostPoolUsers && isCostPoolUsersFetching) ||
    (shouldFetchDepartmentUsers && isDeptUsersFetching) ||
    (shouldFetchMaaEmployees && isMaaEmployeesFetching)

  const activityOptions = useMemo(() => {
    if (activitiesByDepartmentData) {
      return sortSelectOptionsByLabel(activitiesByDepartmentData)
    }
    return []
  }, [activitiesByDepartmentData])

  const costPoolOptions = useMemo(() => {
    if (!departmentId) return []
    return costPoolsByDepartmentData
      ? sortSelectOptionsByLabel(costPoolsByDepartmentData)
      : []
  }, [costPoolsByDepartmentData, departmentId])

  const programOptions = useMemo(() => {
    if (shouldFilterProgramsByUser) {
      return sortSelectOptionsByLabel(userSpecificPrograms ?? [])
    }
    return sortSelectOptionsByLabel(allProgramsData ?? [])
  }, [allProgramsData, userSpecificPrograms, shouldFilterProgramsByUser])


  const downloadTypeOptions = useMemo(
    () => REPORT_DOWNLOAD_TYPES.map((t) => ({ value: t, label: t })),
    [],
  )

  const persistIfRequested = (values: ReportFormValues) => {
    if (values.retainParameters) {
      writeStoredReportFormParams(values)
      return
    }
    clearStoredReportFormParams()
  }

  const queryClient = useQueryClient()

  const fetchCountyClientOnDemand = async () => {
    let currentCountyClient = countyClient
    if (!currentCountyClient) {
      currentCountyClient = await queryClient.fetchQuery({
        queryKey: [...settingsCountyClientQueryKey, user?.countyName ?? "", user?.namespace ?? ""],
        queryFn: () => fetchClientForCurrentCounty(user?.countyName, user?.namespace),
        staleTime: 60_000,
      }).catch(() => undefined)
    }
    return {
      resolvedCountyName: formatCountyDisplayName(currentCountyClient?.name || user?.countyName),
      resolvedLogoSrc: resolveCountyClientLogoSrc(currentCountyClient),
    }
  }

  const onViewReport = handleSubmit(async (values) => {
    const { resolvedCountyName, resolvedLogoSrc } = await fetchCountyClientOnDemand()
    const payload: ReportRunPayload = {
      ...mapReportFormToRunPayload(values),
      ...(resolvedCountyName ? { countyName: resolvedCountyName } : {}),
      ...(resolvedLogoSrc ? { countyLogoDataUrl: resolvedLogoSrc } : {}),
    }
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

  const onDownloadReport = handleSubmit(async (values) => {
    const parsedName = reportDownloadFileNameSchema.safeParse(values.fileName)
    if (!parsedName.success) {
      const msg = parsedName.error.issues[0]?.message ?? "Enter a file name"
      setError("fileName", { type: "manual", message: msg })
      return
    }

    const { resolvedCountyName, resolvedLogoSrc } = await fetchCountyClientOnDemand()
    const payload: ReportRunPayload = {
      ...mapReportFormToRunPayload({
        ...values,
        fileName: parsedName.data,
      }),
      ...(resolvedCountyName ? { countyName: resolvedCountyName } : {}),
      ...(resolvedLogoSrc ? { countyLogoDataUrl: resolvedLogoSrc } : {}),
    }

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



  type ReportFiltersBodyProps = {
    control: any
    currentReportItem: any
    fiscalYearOptions: any[]
    quarterOptions: any[]
    labelClassName: string
    yearQuarterSelectTrigger: string
    dateInputInRowClassName: string
    setValue: any
    fiscalYearId: string
    quarter: string
    selectMonthBy: string
    formState: any
    timeStudyPeriodOptions: any[]
    departmentId?: string
    showTopLevelFiscalYear: boolean
    topLevelFiscalYearLabel: string
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
    showTopLevelFiscalYear,
    topLevelFiscalYearLabel,
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

                    if (currentReportItem?.key === "DSSRPT1") {
                      setValue("dateFrom", fromStr, { shouldValidate: true })
                      setValue("dateTo", addDays(fromStr, 27), { shouldValidate: true })
                    } else {
                      setValue("dateFrom", fromStr, { shouldValidate: true })
                      setValue("dateTo", toStr, { shouldValidate: true })
                    }
                  }
                }}
              >
                {(() => {
                  const criteria = currentReportItem?.criteria
                  const monthByFlags = resolveReportMonthByFlags(criteria)

                  return (
                    <>
                      {monthByFlags.showQtr && (
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="qtr" id="reports-month-qtr" />
                          <Label htmlFor="reports-month-qtr" className="text-[14px] font-normal">
                            Qtr
                          </Label>
                        </div>
                      )}
                      {monthByFlags.showDates && (
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="dates" id="reports-month-dates" />
                          <Label htmlFor="reports-month-dates" className="text-[14px] font-normal">
                            Dates
                          </Label>
                        </div>
                      )}
                      {monthByFlags.showMonth && (
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="month" id="reports-month-only" />
                          <Label htmlFor="reports-month-only" className="text-[14px] font-normal">
                            Month
                          </Label>
                        </div>
                      )}
                      {monthByFlags.showYear && (
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="year" id="reports-year-only" />
                          <Label htmlFor="reports-year-only" className="text-[14px] font-normal">
                            Year
                          </Label>
                        </div>
                      )}
                      {monthByFlags.showScheduled && (
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
            {!showTopLevelFiscalYear && (
              <div className="w-[152px] shrink-0">
                <label className={labelClassName} htmlFor="reports-fiscal-year">
                  {topLevelFiscalYearLabel}
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
        ) : selectMonthBy === "month" ? (
          <div className="w-[180px] shrink-0">
            <label className={labelClassName} htmlFor="reports-month-input">
              Month
            </label>
            <Controller
              name="month"
              control={control}
              render={({ field }) => (
                <ReportMonthPicker
                  id="reports-month-input"
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
            {!showTopLevelFiscalYear && isTrue(currentReportItem?.criteria?.showScheduleTime) && (
              <div className="w-[180px] shrink-0">
                <label className={labelClassName} htmlFor="reports-scheduled-fiscal-year">
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
                    onChange={(val) => {
                      field.onChange(val)
                      const selectedPeriod = timeStudyPeriodOptions.find((opt) => opt.value === val)
                      const nextFrom = normalizeToDateInputValue(selectedPeriod?.startDate)
                      const nextTo = normalizeToDateInputValue(selectedPeriod?.endDate)
                      if (nextFrom) {
                        setValue("dateFrom", nextFrom, { shouldValidate: true })
                      }
                      if (nextTo) {
                        setValue("dateTo", nextTo, { shouldValidate: true })
                      }
                    }}
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
                    onChange={(e) => {
                      const val = e.target.value
                      field.onChange(val)
                      if (currentReportItem?.key === "DSSRPT1" && val) {
                        setValue("dateTo", addDays(val, 27), { shouldValidate: true })
                      }
                    }}
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
                    disabled={currentReportItem?.key === "DSSRPT1"}
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


  if (isDeptsLoading) {
    return (
      <div className="flex min-h-[400px] flex-1 items-center justify-center">
        <Spinner className="size-8 text-[#6C5DD3]" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-none rounded-[10px] border border-[#E5E7EB] bg-white px-[19px] pb-8 pt-5 shadow-sm sm:px-8 sm:pb-10 sm:pt-6">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Row 1: Department + Reports + period selection */}
        <div className="flex min-w-0 flex-wrap items-end gap-3 pb-0.5 sm:gap-4">
          {showReportsDepartmentField && (
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
                        form.reset({
                          ...REPORT_FORM_DEFAULT_VALUES,
                          departmentId: val,
                        }, {
                          keepDirtyValues: false,
                        })
                      } else {
                        field.onChange(val)
                      }
                    }}
                    onBlur={field.onBlur}
                    options={departmentOptions}
                    placeholder="Select Department"
                    className={departmentSelectTrigger}
                    isLoading={isDeptsLoading}
                    disabled={rawDepartmentOptions.length === 1}
                    contentClassName="max-h-[220px]"
                    itemButtonClassName="rounded-[6px] px-3 py-2"
                    itemLabelClassName="!text-[14px] !font-normal"
                  />
                )}
              />
            </div>
          )}

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
                    const item = departmentReportItems.find((i) => i.key === val)
                    const label =
                      item?.label ??
                      reportOptions.find((o) => o.value === val)?.label ??
                      ""

                    form.reset({
                      ...REPORT_FORM_DEFAULT_VALUES,
                      departmentId: getValues("departmentId"),
                      reportKey: val,
                      fileName: label,
                    }, {
                      keepDirtyValues: false,
                    })

                    if (!item) return

                    const defaultSelectMonthBy = resolveDefaultSelectMonthBy(item.criteria)
                    if (defaultSelectMonthBy) {
                      form.setValue("selectMonthBy", defaultSelectMonthBy)
                    }
                  }}
                  onBlur={field.onBlur}
                  options={reportOptions}
                  placeholder="Select Report"
                  disabled={!departmentId || deptReportsLoading}
                  isLoading={deptReportsLoading}
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
                    onChange={(val) => {
                      if ((field.value ?? "") !== val) {
                        form.setValue("employeeIds", "")
                        form.setValue("activityIds", "")
                        form.setValue("costPoolIds", "")
                        form.setValue("programIds", "")
                      }
                      field.onChange(val)
                    }}
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

          {showTopLevelFiscalYear && (
            <div className="w-[180px] shrink-0">
              <label className={labelClassName} htmlFor="reports-fiscal-year">
                {topLevelFiscalYearLabel}
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

          {!showScheduleTime && (
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
              showTopLevelFiscalYear={showTopLevelFiscalYear}
              topLevelFiscalYearLabel={topLevelFiscalYearLabel}
            />
          )}


        </div>

        {showScheduleTime && (
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
                showTopLevelFiscalYear={showTopLevelFiscalYear}
                topLevelFiscalYearLabel={topLevelFiscalYearLabel}
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
                const costPoolFirst = isTrue(criteria.showCostPoolSelect) || isTrue(criteria.showCostPool)
                const filterBlocks = [
                  {
                    id: "employee",
                    show: isTrue(criteria.multipleEmployees),
                    order: costPoolFirst ? 2 : 1,
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
                        isLoading={isEmployeeLoading}
                        onValuesChange={() => {
                          setValue("activityIds", "")
                          setValue("programIds", "")
                        }}
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
                    show: isTrue(criteria.showCostPoolSelect) || isTrue(criteria.showCostPool),
                    order: costPoolFirst ? 1 : 4,
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
                        placeholder={
                          departmentId ? "Select Cost Pool" : "Select department first"
                        }
                        emptyListMessage={
                          departmentId ? "No cost pools available" : "Select a department first"
                        }
                        isLoading={shouldFetchCostPoolsByDepartment && isCostPoolsByDeptFetching}
                        onValuesChange={() => {
                          setValue("employeeIds", "")
                          setValue("activityIds", "")
                          setValue("programIds", "")
                        }}
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
                onValuesChange={() => setValue("activityIds", "")}
                isLoading={isEmployeeLoading}
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
                    onCheckedChange={(v) => {
                      const checked = v === true
                      field.onChange(checked)
                      if (!checked) {
                        clearStoredReportFormParams()
                      }
                    }}
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

        <LoadingProgress isLoading={isViewPending || isDownloadPending} />

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
                className="h-[85vh] min-h-[720px] w-full"
              />
            </div>
          </div>
        ) : null}
      </form>
    </div>
  )
}
