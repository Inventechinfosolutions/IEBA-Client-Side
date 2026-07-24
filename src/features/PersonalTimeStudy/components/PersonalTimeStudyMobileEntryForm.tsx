/**
 * PersonalTimeStudyMobileEntryForm
 *
 * Mobile-only (< xl / 1280px) version of the time entry form.
 * Renders each parent time entry as a card (bg-[#F8F9FC] border-gray-200),
 * with child multicode sub-rows nested inside as white inner cards.
 * Same props, state, handlers, and API logic as PersonalTimeStudyEntryForm.
 * Desktop breakpoints (xl:) are NOT used here — this component is hidden on desktop.
 */

import { ChevronDown, Clock, Eye, Plus, Trash2, Check, AlertCircle, AlertTriangle } from "lucide-react"
import { useCallback, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react"
import type { UserAssignedDepartmentsSettingChecks } from "../queries/getUserAssignedDepartmentsSettingChecks"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { Popover, PopoverContent, PopoverAnchor, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PersonalTimeStudyApportioningPanel } from "./PersonalTimeStudyApportioningPanel"
import { useAuth } from "@/contexts/AuthContext"
import { API_BASE_URL } from "@/lib/config"
import {
  apiDownloadSupportingDoc,
  apiDeleteSupportingDoc,
  apiGetUserActivitiesForProgram,
  apiGetUserProgramsAndActivitiesMulticode,
} from "../api/personalTimeStudyApi"
import { Spinner } from "@/components/ui/spinner"
import { normalizeMulticodeDropdownPayload } from "../utils/multicodeDropdownUtils"
import {
  buildDecimalMinMessage,
  DecimalActivityTimeHint,
  isQuarterHourDecimal,
  roundDecimalHoursToQuarterHour,
} from "../utils/decimalTimeHint.tsx"
import { formatTimeInput, normalizeTimeOnBlur } from "../utils/timeUtils"
import {
  parkPersonalTimeStudyFocus,
  parkPersonalTimeStudyFocusSoon,
} from "../utils/focusUtils"

// Re-export types for convenience (shared with desktop form)
export type { TimeEntrySubRow, TimeEntryParentRow, TimeEntryRow } from "./PersonalTimeStudyEntryForm"
import type { TimeEntrySubRow, TimeEntryParentRow } from "./PersonalTimeStudyEntryForm"

// ─── Local helpers ────────────────────────────────────────────────────────────

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

function leaveBannerStatusLabel(status?: string | null): string {
  const normalized = status?.toLowerCase() ?? ""
  if (normalized === "draft") return "   (Draft)  "
  if (normalized === "requested") return "   (Requested not yet approved)"
  return ""
}

type MinDecimalFieldProps = {
  label: ReactNode
  labelClassName?: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  showDecimalHint?: boolean
  hintMessage?: string | null
  inputClassName?: string
  heightClass?: string
  containerClassName?: string
}

function MinDecimalField({
  label,
  labelClassName,
  value,
  onChange,
  readOnly,
  showDecimalHint,
  hintMessage,
  inputClassName,
  heightClass = "h-10",
  containerClassName,
}: MinDecimalFieldProps) {
  const [originalValue, setOriginalValue] = useState<string | null>(null)

  const displayMessage = showDecimalHint
    ? hintMessage ?? (
      originalValue !== null
        ? `${originalValue} hrs rounded to ${value} hrs (${Math.round(Number(value) * 60)} mins)`
        : buildDecimalMinMessage(value)
    )
    : null

  const handleBlur = () => {
    if (!showDecimalHint || readOnly || !value.trim()) return
    const rounded = roundDecimalHoursToQuarterHour(value)
    if (rounded !== value) {
      setOriginalValue(value)
      onChange?.(rounded)
    }
  }

  return (
    <div className={cn("space-y-0.5 w-full", showDecimalHint ? "max-w-[92px]" : "max-w-[80px]", containerClassName)}>
      <Label className={labelClassName}>{label}</Label>
      <div className="relative">
        <TitleCaseInput
          type="number"
          min="0"
          step={showDecimalHint ? "0.25" : "1"}
          readOnly={readOnly}
          value={value}
          placeholder="—"
          className={cn(
            heightClass,
            "text-[11px]",
            displayMessage && "pr-8",
            readOnly && "bg-[#F2F4F7] cursor-not-allowed",
            inputClassName,
          )}
          onChange={(e) => {
            setOriginalValue(null)
            onChange?.(e.target.value)
          }}
          onBlur={handleBlur}
        />
        {displayMessage ? (
          <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
            <div className="pointer-events-auto">
              <DecimalActivityTimeHint message={displayMessage} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createSubRow(): TimeEntrySubRow {
  return {
    id: newId(),
    studyProgram: "",
    serviceActivity: "",
    totalMin: "",
    description: "",
    start: "",
    end: "",
  }
}

function createParent(): TimeEntryParentRow {
  return {
    id: newId(),
    start: "",
    end: "",
    totalMin: "",
    tsProgram: "",
    serviceActivity: "",
    description: "",
    supportingDocLabel: "",
    supportingDocs: [],
    subRows: [],
  }
}

function computeDurationMinutes(start: string, end: string): string {
  if (!start?.trim() || !end?.trim()) return ""
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return ""
  const s = sh * 60 + sm
  const e = eh * 60 + em
  let d = e - s
  if (d < 0) d += 24 * 60
  return String(d)
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  if (!time) return ""
  const [hStr, mStr] = time.split(":")
  let h = parseInt(hStr || "0", 10)
  let m = parseInt(mStr || "0", 10)
  if (isNaN(h) || isNaN(m)) return ""
  m += minutesToAdd
  h += Math.floor(m / 60)
  m = m % 60
  h = h % 24
  if (h < 0) h += 24
  if (m < 0) m += 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// ─── TimePicker ───────────────────────────────────────────────────────────────

const TIME_PICKER_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const TIME_PICKER_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

function TimeEntriesTimePickerDropdown({
  value,
  onChange,
  minuteStep = 15,
}: {
  value: string
  onChange: (v: string) => void
  onClose?: () => void
  minuteStep?: number
}) {
  const [localTime, setLocalTime] = useState(value || "00:00")
  const [prevValue, setPrevValue] = useState(value)

  if (value !== prevValue) {
    setPrevValue(value)
    setLocalTime(value || "00:00")
  }

  const parts = localTime.split(":")
  const h = parts[0] ?? ""
  const m = parts[1] ?? ""
  const filteredMinutes = TIME_PICKER_MINUTES.filter((minute) => parseInt(minute, 10) % minuteStep === 0)

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setTimeout(() => {
        node.querySelectorAll('[data-selected="true"]').forEach((el) => {
          el.scrollIntoView({ block: "start", behavior: "auto" })
        })
      }, 0)
    }
  }, [])

  return (
    <div ref={scrollRef} className="flex flex-col w-[120px] bg-white dark:bg-zinc-900 overflow-hidden rounded-md border dark:border-zinc-800">
      <div className="flex h-[200px] divide-x divide-gray-100 dark:divide-zinc-800">
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 pb-[170px] gap-0.5">
            {TIME_PICKER_HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                tabIndex={-1}
                data-selected={h === hour}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  h === hour ? "bg-[#eaf4ff] dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 font-semibold" : "bg-transparent text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800",
                )}
                onMouseDown={(e: MouseEvent) => {
                  e.preventDefault()
                  const newTime = `${hour}:${m || "00"}`
                  setLocalTime(newTime)
                  onChange(newTime)
                }}
              >
                {hour}
              </button>
            ))}
          </div>
        </ScrollArea>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 pb-[170px] gap-0.5">
            {filteredMinutes.map((minute) => (
              <button
                key={minute}
                type="button"
                tabIndex={-1}
                data-selected={m === minute}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  m === minute ? "bg-[#eaf4ff] dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 font-semibold" : "bg-transparent text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800",
                )}
                onMouseDown={(e: MouseEvent) => {
                  e.preventDefault()
                  const newTime = `${h || "00"}:${minute}`
                  setLocalTime(newTime)
                  onChange(newTime)
                }}
              >
                {minute}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function TimePicker24h({
  value,
  onChange,
  label,
  required = true,
  disabled = false,
  isLeave = false,
  isApportioned = false,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  required?: boolean
  disabled?: boolean
  isLeave?: boolean
  isApportioned?: boolean
}) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const openMenu = () => {
    if (!disabled) setOpen(true)
  }

  const handleBlur = () => {
    onChange(normalizeTimeOnBlur(value))
  }

  return (
    <div className="flex flex-col gap-1 flex-1">
      <Label className="text-[11px] text-muted-foreground">
        {label} {required && <RequiredMark />}
      </Label>
      <Popover modal={false} open={open} onOpenChange={(val) => !disabled && setOpen(val)}>
        <div className="relative">
          <PopoverAnchor asChild>
            <div
              ref={anchorRef}
              data-time-picker-anchor
              className={cn("relative cursor-pointer", disabled && "cursor-not-allowed")}
              onClick={openMenu}
            >
              <TitleCaseInput
                value={value}
                disabled={disabled}
                placeholder="--:--"
                onChange={(e) => onChange(formatTimeInput(e.target.value))}
                onBlur={handleBlur}
                onFocus={openMenu}
                onKeyDown={(e) => {
                  if (e.key === "Tab") setOpen(false)
                  if (e.key === "Escape") {
                    e.preventDefault()
                    setOpen(false);
                    (e.target as HTMLInputElement).blur()
                  }
                }}
                className={cn(
                  "h-10 pr-8 text-[11px] font-normal rounded-[6px] text-[#344054] dark:text-zinc-100 bg-white dark:bg-transparent w-full",
                  disabled && "bg-[#F2F4F7] dark:bg-zinc-800/80 cursor-not-allowed pointer-events-none !opacity-100",
                  isLeave && "border-yellow-400",
                  isApportioned && "border-[#6C5DD3]",
                )}
              />
              <Clock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-70 pointer-events-none text-gray-500" />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="p-0 w-auto time-picker-popover"
            align="start"
            side="top"
            sideOffset={5}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement
              if (anchorRef.current?.contains(target)) e.preventDefault()
            }}
          >
            <TimeEntriesTimePickerDropdown
              value={value}
              onChange={onChange}
              onClose={() => setOpen(false)}
              minuteStep={15}
            />
          </PopoverContent>
        </div>
      </Popover>
    </div>
  )
}

// ─── SupportingDocField ───────────────────────────────────────────────────────

function SupportingDocField({
  parentId,
  docs,
  uploading,
  disabled = false,
  onAdd,
  onDelete,
  onDownload,
  isLeave = false,
  isApportioned = false,
}: {
  parentId: string
  docs: Array<{ name: string; url: string; file?: File; docId?: number }>
  uploading: boolean
  disabled?: boolean
  onAdd: (parentId: string, files: FileList) => void
  onDelete: (parentId: string, name: string) => void
  onDownload: (parentId: string, doc: { name: string; url: string; file?: File; docId?: number }) => void
  isLeave?: boolean
  isApportioned?: boolean
}) {
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const pillLabel = uploading ? "Uploading..." : docs.length === 0 ? "Supporting doc" : docs[0].name
  const extraCount = docs.length > 1 ? docs.length - 1 : 0

  return (
    <div className={cn("flex-1 space-y-0.5 relative")}>
      <Label className="text-[11px] text-muted-foreground">Supporting doc</Label>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => { if (e.target.files?.length) { onAdd(parentId, e.target.files); e.target.value = "" } }}
      />
      <div className={cn(
        "flex h-10 w-full items-center rounded-[6px] border border-input text-[11px] overflow-hidden bg-white dark:bg-transparent",
        disabled && "bg-[#F2F4F7] dark:bg-zinc-800/80 cursor-not-allowed",
        isLeave && "border-yellow-400",
        isApportioned && "border-[#6C5DD3]"
      )}>
        <button
          type="button"
          disabled={disabled}
          className={cn("flex flex-1 min-w-0 items-center px-2 overflow-hidden", disabled && "cursor-not-allowed")}
          onClick={() => !disabled && setOpen((v) => !v)}
        >
          <span className="truncate text-foreground flex-1">{pillLabel}</span>
          {extraCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-[6px] bg-[#6C5DD3]/10 text-[#6C5DD3] text-[10px] font-bold shrink-0">
              +{extraCount}
            </span>
          )}
          <ChevronDown className={cn("size-3 ml-1 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {!disabled && (
          <button
            type="button"
            disabled={uploading}
            aria-label="Upload supporting document"
            onClick={() => fileRef.current?.click()}
            className={cn("shrink-0 w-10 border-l border-input h-full text-[#6C5DD3] hover:bg-accent flex items-center justify-center", uploading && "opacity-40 cursor-not-allowed")}
          >
            <Plus className="size-5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-md border border-border bg-white dark:bg-zinc-900 shadow-lg py-1">
          {docs.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted-foreground italic">No documents uploaded</div>
          ) : (
            docs.map((doc) => (
              <div key={doc.name} className="flex items-center gap-2 px-3 py-1.5">
                <span className="flex-1 truncate text-[11px] text-foreground">{doc.name}</span>
                <button type="button" className="shrink-0 text-[#6C5DD3] hover:opacity-70 cursor-pointer" onClick={() => { onDownload(parentId, doc); setOpen(false) }}>
                  <Eye className="size-3.5" />
                </button>
                {!disabled && (
                  <button type="button" className="shrink-0 text-destructive hover:opacity-70 cursor-pointer" onClick={() => { onDelete(parentId, doc.name); if (docs.length <= 1) setOpen(false) }}>
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Card class constants ─────────────────────────────────────────────────────

/** Outer parent entry card — slate-tinted background */
const parentCardClass = "flex flex-col gap-3 border border-gray-200 dark:border-zinc-700 rounded-[10px] p-3.5 bg-[#F8F9FC] dark:bg-zinc-900/60 shadow-sm"

/** Inner child multicode card — white background */
const childCardClass = "flex flex-col gap-3 border border-[#6C5DD3]/25 dark:border-[#6C5DD3]/40 rounded-[8px] p-3 bg-white dark:bg-zinc-950 shadow-xs"

// ─── Props (identical to PersonalTimeStudyEntryForm) ─────────────────────────

type PersonalTimeStudyMobileEntryFormProps = {
  className?: string
  dateStr: string
  initialRecords?: any[]
  dropdownData?: any[]
  onSave?: (parents: any[]) => void
  onSubmit?: (parents: any[]) => void
  onDelete?: (id: number) => void
  userId?: string
  username?: string
  readonly?: boolean
  allocatedTotal?: number
  actualTotal?: number
  balanceTotal?: number
  actualMultiTotal?: number
  multiBalanceTotal?: number
  hideSummaryHeader?: boolean
  showLeaveBanner?: boolean
  leaveRecords?: Array<{
    starttime: string
    endtime: string
    status: string
    programcode?: string
    activitycode?: string
    programid?: string | number
    activityid?: string | number
    programname?: string
    activityname?: string
    name?: string
    employeeName?: string
    parentId?: number | null
    id?: number
    leaveTotalTime?: number | string
    multiCodeRecords?: Array<{
      id?: number
      programid?: string | number | null
      activityid?: string | number | null
      programcode?: string
      programname?: string
      activitycode?: string
      activityname?: string
      leaveTotalTime?: number | string
      status?: string
    }>
  }>
  apportioningConfig?: UserAssignedDepartmentsSettingChecks | null
  apportioningRecords?: any[]
  apportioningSummary?: any[]
  isLoading?: boolean
  isDropdownLoading?: boolean
  onOpenDropdown?: () => void
  departmentMulticodes?: Record<string, any[]>
  fetchingDepartments?: Record<string, boolean>
  onFetchMulticodeDept?: (deptId: string | number | undefined) => Promise<void>
  refetchConfig?: () => void
  hideApportioningInfo?: boolean
  onOpenPeriodsSheet?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalTimeStudyMobileEntryForm({
  dateStr,
  userId: propsUserId,
  username: propsUsername,
  initialRecords,
  dropdownData,
  onSave,
  onSubmit,
  onDelete,
  readonly = false,
  allocatedTotal,
  actualTotal,
  balanceTotal,
  actualMultiTotal,
  multiBalanceTotal,
  hideSummaryHeader = false,
  showLeaveBanner = false,
  leaveRecords,
  className,
  apportioningConfig,
  apportioningSummary,
  isLoading = false,
  isDropdownLoading = false,
  onOpenDropdown,
  departmentMulticodes: propDepartmentMulticodes,
  fetchingDepartments: propFetchingDepartments,
  onFetchMulticodeDept,
  apportioningRecords,
  refetchConfig,
  hideApportioningInfo = false,
  onOpenPeriodsSheet,
}: PersonalTimeStudyMobileEntryFormProps) {
  const { user } = useAuth()
  const userId = propsUserId || user?.id || ""
  const selfName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.name || ""
    : ""
  const username = propsUsername || selfName

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [openApportioning, setOpenApportioning] = useState(false)
  const [parents, setParents] = useState<TimeEntryParentRow[]>([createParent()])
  const [prevInitialRecords, setPrevInitialRecords] = useState<any[] | undefined>(undefined)
  const [prevLeaveRecords, setPrevLeaveRecords] = useState<any[] | undefined>(undefined)
  const focusSinkRef = useRef<HTMLSpanElement>(null)

  const isLocked = useMemo(() => {
    if (readonly) return true
    if (apportioningConfig && apportioningConfig.allowUserEntry === false) return true
    if (!initialRecords) return false
    return initialRecords.some(rec =>
      rec.date?.split("T")[0] === dateStr &&
      !rec.leaveid &&
      (!rec.leave || rec.leave === "null" || rec.leave === "NULL") &&
      ["submitted", "approved"].includes(rec.status?.toLowerCase()) &&
      rec.apportioning !== true
    )
  }, [initialRecords, dateStr, readonly, apportioningConfig])

  const allIsLeave = false

  const programs = useMemo(() => {
    const allowedDeptIds = apportioningConfig?.timestudyAllowedDepartmentIds?.map((d) => d.departmentId) ?? []
    const filteredData = allowedDeptIds.length > 0
      ? (dropdownData ?? []).filter((d) => allowedDeptIds.includes(d.departmentId))
      : (dropdownData ?? [])
    const list = filteredData.flatMap((d) => d.programs.map((p: any) => ({ ...p, departmentCode: d.departmentCode })))
    return Array.from(new Map(list.map((p) => [p.id, p])).values())
  }, [dropdownData, apportioningConfig?.timestudyAllowedDepartmentIds])

  const allowMulticodeUi = apportioningConfig?.allowMultiCodes === true

  const [programActivities, setProgramActivities] = useState<Record<string, any[]>>({})
  const fetchedRef = useRef<Set<string>>(new Set())

  const [localDepartmentMulticodes, setLocalDepartmentMulticodes] = useState<Record<string, any[]>>({})
  const [localFetchingDepartments, setLocalFetchingDepartments] = useState<Record<string, boolean>>({})
  const localFetchedMulticodesRef = useRef<Set<string>>(new Set())
  const parentsSnapshotRef = useRef<TimeEntryParentRow[]>([])

  const departmentMulticodes = propDepartmentMulticodes ?? localDepartmentMulticodes
  const fetchingDepartments = propFetchingDepartments ?? localFetchingDepartments

  const multicodeBundles = useMemo(() => {
    if (!allowMulticodeUi) return []
    const allRaw = Object.values(departmentMulticodes).flat()
    if (!allRaw.length) return []
    return normalizeMulticodeDropdownPayload(allRaw, dropdownData)
  }, [allowMulticodeUi, departmentMulticodes, dropdownData])

  const resolveDepartmentIdForProgram = useCallback(
    (programIdStr: string | undefined): number | undefined => {
      const trimmed = programIdStr?.trim()
      if (!trimmed) return undefined

      const entityDepartmentId = (entity: any): number | undefined => {
        if (!entity) return undefined
        const raw = entity.departmentId ?? entity.department?.id
        if (raw == null || raw === "") return undefined
        const n = Number(raw)
        if (!Number.isFinite(n) || n <= 0) return undefined
        return n
      }

      const findDepartmentInBundles = (bundles: any[] | undefined): number | undefined => {
        if (!bundles?.length) return undefined
        for (const d of bundles) {
          const pr = (d.programs ?? []).find((p: any) => String(p.id) === trimmed)
          if (!pr) continue
          const fromProgram = entityDepartmentId(pr)
          if (fromProgram != null) return fromProgram
          const fromBundle = entityDepartmentId(d)
          if (fromBundle != null) return fromBundle
        }
        return undefined
      }

      if (allowMulticodeUi) {
        const fromMc = findDepartmentInBundles(multicodeBundles.length ? multicodeBundles : undefined)
        if (fromMc != null) return fromMc
      }
      return findDepartmentInBundles(dropdownData ?? undefined)
    },
    [allowMulticodeUi, multicodeBundles, dropdownData],
  )

  const getRowSettings = useCallback((parent: TimeEntryParentRow) => {
    const deptId = resolveDepartmentIdForProgram(parent.tsProgram) ?? parent.departmentId
    const departments = apportioningConfig?.departments
    const deptConfig = departments?.find((d: any) => Number(d.departmentId) === Number(deptId))
    const activeConfig = deptId != null
      ? (deptConfig ?? departments?.[0])
      : (departments?.length === 1 ? departments[0] : deptConfig)

    if (!activeConfig) {
      return {
        hideTime: false,
        hideSupportingDoc: false,
        hideDescriptionActivityNote: false,
        hideDescriptionActivityNoteAnchor: false,
        hideDescriptionActivityNoteMultiCode: false,
        removeAutoFillEndTime: false,
        moveSaveSubmitToTop: false,
      }
    }

    return {
      hideTime: activeConfig.requiresStartEndTime === false,
      hideSupportingDoc: activeConfig.requiresSupportingDoc === false,
      hideDescriptionActivityNote: activeConfig.requiresDescriptionActivityNotes === false,
      hideDescriptionActivityNoteAnchor: activeConfig.requiresDescriptionActivityNotesAnchor === false,
      hideDescriptionActivityNoteMultiCode: activeConfig.requiresDescriptionActivityNotesMultiCode === false,
      removeAutoFillEndTime: activeConfig.removeAutoFillEndTime === true,
      moveSaveSubmitToTop: activeConfig.requiresSaveAndSubmitButtonMoveToTop === true,
    }
  }, [apportioningConfig?.departments, resolveDepartmentIdForProgram])

  const isMulticodeAllowedForParent = useCallback(
    (parent: TimeEntryParentRow) => {
      const deptId = parent.departmentId
        ? Number(parent.departmentId)
        : resolveDepartmentIdForProgram(parent.tsProgram)
      if (!deptId) return false
      const userMultiCode = apportioningConfig?.userMultiCode ?? []
      return userMultiCode.some(item => Number(item.departmentId) === Number(deptId))
    },
    [resolveDepartmentIdForProgram, apportioningConfig?.userMultiCode],
  )

  const refetchedDeptsRef = useRef<Set<number>>(new Set())
  const hasRefetchedEmptyConfig = useRef(false)

  const checkAndRefetchConfig = useCallback((programIdStr: string | undefined) => {
    if (!refetchConfig) return
    const programId = programIdStr?.trim()
    if (!programId) return
    const deptId = resolveDepartmentIdForProgram(programId)
    if (!deptId) return
    const hasDeptConfig = apportioningConfig?.departments?.some((d: any) => Number(d.departmentId) === Number(deptId))
    if (!apportioningConfig && !hasRefetchedEmptyConfig.current) {
      hasRefetchedEmptyConfig.current = true
      refetchConfig()
    } else if (apportioningConfig && !hasDeptConfig && !refetchedDeptsRef.current.has(deptId)) {
      refetchedDeptsRef.current.add(deptId)
      refetchConfig()
    }
  }, [apportioningConfig, refetchConfig, resolveDepartmentIdForProgram])

  const fetchMulticodeProgramsForDepartment = useCallback(async (deptIdStr: string | number | undefined) => {
    if (onFetchMulticodeDept) return onFetchMulticodeDept(deptIdStr)
    const deptId = String(deptIdStr || '').trim()
    if (!deptId || !userId) return
    if (localFetchedMulticodesRef.current.has(deptId)) return
    localFetchedMulticodesRef.current.add(deptId)
    setLocalFetchingDepartments(prev => ({ ...prev, [deptId]: true }))
    try {
      const res = await apiGetUserProgramsAndActivitiesMulticode(userId, deptId)
      setLocalDepartmentMulticodes(prev => ({ ...prev, [deptId]: res || [] }))
    } catch (err) {
      localFetchedMulticodesRef.current.delete(deptId)
      console.error(`Failed to fetch multicode programs for department ${deptId}`, err)
    } finally {
      setLocalFetchingDepartments(prev => ({ ...prev, [deptId]: false }))
    }
  }, [onFetchMulticodeDept, userId])

  const fetchActivitiesForProgram = useCallback(async (programIdStr: string | undefined, explicitDeptId?: number) => {
    const programId = programIdStr?.trim()
    if (!programId || !userId) return
    const deptId = explicitDeptId ?? resolveDepartmentIdForProgram(programId)
    if (!deptId) return
    const key = `${deptId}:${programId}`
    if (fetchedRef.current.has(key)) return
    fetchedRef.current.add(key)
    try {
      const res = await apiGetUserActivitiesForProgram(userId, deptId, programId)
      setProgramActivities(prev => ({ ...prev, [key]: res || [] }))
    } catch (err) {
      fetchedRef.current.delete(key)
      console.error(`Failed to fetch activities for program ${programId} in dept ${deptId}`, err)
    }
  }, [userId, resolveDepartmentIdForProgram])

  const isFetchingActivitiesForProgram = useCallback(
    (programId: string | undefined, explicitDeptId?: number) => {
      const normalized = String(programId ?? "").trim()
      if (!normalized) return false
      const deptId = explicitDeptId ?? resolveDepartmentIdForProgram(normalized)
      if (!deptId) return false
      const key = `${deptId}:${normalized}`
      return !programActivities[key] && fetchedRef.current.has(key)
    },
    [programActivities, resolveDepartmentIdForProgram],
  )

  const moveSaveSubmitToTop = useMemo(() => {
    const departments = apportioningConfig?.departments
    if (departments?.length === 1) return departments[0].requiresSaveAndSubmitButtonMoveToTop === true
    const activeParents = parents.filter(p => {
      if (p.isLeave || !p.tsProgram) return false
      if (p.apportioning) {
        const isManual = p.apportioningType?.toUpperCase() === "MANUAL"
        const isRejectedOrOpened = ["rejected", "opened"].includes(p.status?.toLowerCase() ?? "")
        return isManual && isRejectedOrOpened
      }
      return true
    })
    if (activeParents.length === 0) return false
    return activeParents.every(p => getRowSettings(p).moveSaveSubmitToTop)
  }, [parents, getRowSettings, apportioningConfig?.departments])

  const allDepartmentsUseDecimalTime = useMemo(() => {
    const depts = apportioningConfig?.departments ?? []
    return depts.length > 0 && depts.every((d) => d.requiresStartEndTime === false)
  }, [apportioningConfig?.departments])

  const resolveEffectiveHideTime = useCallback(
    (parent: TimeEntryParentRow) => {
      const hideTime = getRowSettings(parent).hideTime
      return hideTime || !!parent.activityTimeMessage || allDepartmentsUseDecimalTime
    },
    [getRowSettings, allDepartmentsUseDecimalTime],
  )

  // Sync server records to state
  if (initialRecords !== prevInitialRecords || leaveRecords !== prevLeaveRecords) {
    setPrevInitialRecords(initialRecords)
    setPrevLeaveRecords(leaveRecords)
    const syncRecordsToState = () => {
      const filtered = (initialRecords ?? []).filter((r) => {
        if (r.date?.split("T")[0] !== dateStr) return false
        if (r.apportioning === true) {
          const isManual = r.apportioningType?.toUpperCase() === "MANUAL"
          const isRejectedOrOpened = ["rejected", "opened", "draft"].includes(r.status?.toLowerCase() ?? "")
          if (!(isManual && isRejectedOrOpened)) return false
        }
        if (r.leaveid) {
          const leave = leaveRecords?.find((l) => Number(l.id) === Number(r.leaveid))
          if (leave && !["approved", "requested", "draft"].includes(leave.status?.toLowerCase() ?? "")) return false
        }
        return true
      })
      const parentMap = new Map<number, TimeEntryParentRow>()
      filtered.forEach((rec) => {
        if (!rec.parentId) {
          const parentRow: TimeEntryParentRow = {
            id: String(rec.id),
            dbId: rec.id,
            start: rec.starttime ? String(rec.starttime).slice(0, 5) : "",
            end: rec.endtime ? String(rec.endtime).slice(0, 5) : "",
            totalMin: String(rec.activitytime ?? ""),
            activityTimeMessage: rec.message ?? null,
            tsProgram: rec.programid ? String(rec.programid) : "",
            serviceActivity: String(rec.activityid ?? ""),
            description: rec.description ?? "",
            supportingDocLabel: "",
            supportingDocs: (rec.supportingDocs ?? []).map((d: any) => ({
              name: d.fileName,
              url: `${API_BASE_URL}/timestudyrecords/${rec.id}/supporting-doc`,
              docId: d.id ?? undefined,
            })),
            programCode: rec.programcode,
            programName: rec.programname,
            activityCode: rec.activitycode,
            activityName: rec.activityname,
            departmentCode: rec.departmentcode,
            departmentId: rec.departmentId,
            subRows: (rec.multiCodeRecords ?? []).map((m: any) => ({
              id: String(m.id),
              dbId: m.id,
              studyProgram: m.programid ? String(m.programid) : "",
              serviceActivity: String(m.activityid ?? ""),
              totalMin: String(m.activitytime ?? ""),
              activityTimeMessage: m.message ?? null,
              description: m.description ?? "",
              start: m.starttime ? String(m.starttime).slice(0, 5) : "",
              end: m.endtime ? String(m.endtime).slice(0, 5) : "",
              programCode: m.programcode,
              programName: m.programname,
              activityCode: m.activitycode,
              activityName: m.activityname,
              departmentCode: m.departmentcode,
              status: m.status,
              recordType: m.recordType,
            })),
            status: rec.status,
            recordType: rec.recordType,
            leaveid: rec.leaveid ?? undefined,
            isLeave: rec.leaveid ? true : undefined,
            apportioning: rec.apportioning,
            apportioningType: rec.apportioningType,
          }
          parentMap.set(rec.id, parentRow)
        }
      })
      const normalRows = Array.from(parentMap.values())
      const leaveRows: TimeEntryParentRow[] = []
      if (leaveRecords) {
        leaveRecords.forEach((leave) => {
          if (["approved", "requested", "draft"].includes(leave.status?.toLowerCase() ?? "")) {
            const lStart = (leave.starttime ?? "").split(":").slice(0, 2).join(":")
            const lEnd = (leave.endtime ?? "").split(":").slice(0, 2).join(":")
            const existing = normalRows.find(
              (rec) => rec.leaveid !== undefined && leave.id !== undefined && Number(rec.leaveid) === Number(leave.id)
            )
            if (existing) {
              existing.isLeave = true
            } else {
              const children = leave.multiCodeRecords ?? []
              const subRows: TimeEntrySubRow[] = children.map((c) => ({
                id: newId(),
                studyProgram: String(c.programid ?? ""),
                serviceActivity: String(c.activityid ?? ""),
                totalMin: String(c.leaveTotalTime ?? "0"),
                activityTimeMessage: (c as any).message ?? null,
                description: (c as any).requestcomment || (c as any).description || "",
                start: "",
                end: "",
                programCode: c.programcode,
                programName: c.programname,
                activityCode: c.activitycode,
                activityName: c.activityname,
                status: c.status,
                recordType: "MULTI_CODE",
              }))
              leaveRows.push({
                id: newId(),
                start: lStart,
                end: lEnd,
                leaveid: leave.id,
                totalMin: String(leave.leaveTotalTime ?? ""),
                activityTimeMessage: (leave as any).message ?? null,
                tsProgram: String(leave.programid ?? ""),
                serviceActivity: String(leave.activityid ?? ""),
                description: (leave as any).requestcomment || (leave as any).description || "",
                supportingDocLabel: "",
                supportingDocs: [],
                subRows: subRows,
                programCode: leave.programcode,
                programName: leave.programname,
                activityCode: leave.activitycode,
                activityName: leave.activityname,
                isLeave: true,
                status: leave.status,
              })
            }
          }
        })
      }
      const combinedUnsorted = [...normalRows, ...leaveRows]
      const combined = combinedUnsorted.sort((a, b) => {
        if (!a.start) return 1
        if (!b.start) return -1
        return b.start.localeCompare(a.start)
      })
      const final = combined.length > 0 ? combined : [createParent()]
      parentsSnapshotRef.current = final.filter(p => {
        if (!p.dbId || p.isLeave || p.leaveid) return false
        if (p.apportioning) {
          const isManual = p.apportioningType?.toUpperCase() === "MANUAL"
          const isRejectedOrOpened = ["rejected", "opened"].includes(p.status?.toLowerCase() ?? "")
          return isManual && isRejectedOrOpened
        }
        return true
      })
      setParents(final)
    }
    syncRecordsToState()
  }

  const getSubRowProgramOptions = useCallback((parentTsProgram: string | undefined) => {
    const mapToOpts = (list: any[]) =>
      list.map((p: any) => {
        const deptPrefix = (p.departmentCode ?? "").split("-")[0]
        return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
      })
    const parentDeptId = resolveDepartmentIdForProgram(parentTsProgram)
    if (allowMulticodeUi && parentDeptId) {
      const rawMc = departmentMulticodes[parentDeptId] || []
      const bundles = normalizeMulticodeDropdownPayload(rawMc, dropdownData)
      const list = bundles.flatMap((d: any) => (d.programs ?? []).map((p: any) => ({ ...p, departmentCode: d.departmentCode })))
      const unique = Array.from(new Map(list.map((p: any) => [p.id, p])).values())
      return mapToOpts(unique)
    }
    const fallbackList = programs.filter((p: any) => p.isMultiCode)
    const filteredFallback = parentDeptId
      ? fallbackList.filter((p: any) => Number(p.departmentId) === Number(parentDeptId))
      : fallbackList
    return mapToOpts(filteredFallback)
  }, [allowMulticodeUi, departmentMulticodes, dropdownData, programs, resolveDepartmentIdForProgram])

  const updateParent = useCallback((id: string, patch: Partial<TimeEntryParentRow>) => {
    setParents((prev) => {
      const next = prev.map((p) => {
        if (p.id !== id) return p
        const updatedP = { ...p, ...patch }
        const rowSettings = getRowSettings(updatedP)
        if (patch.tsProgram !== undefined && patch.tsProgram !== p.tsProgram) {
          updatedP.subRows = p.subRows.map((sr) => ({
            ...sr,
            studyProgram: "",
            serviceActivity: "",
            programCode: undefined,
            programName: undefined,
            activityCode: undefined,
            activityName: undefined,
            departmentCode: undefined,
          }))
        }
        if (patch.start !== undefined && !rowSettings.removeAutoFillEndTime) {
          updatedP.end = addMinutesToTime(patch.start, 15)
        }
        if (patch.start !== undefined || patch.end !== undefined) {
          const hideTime = rowSettings.hideTime
          if (!hideTime) {
            updatedP.totalMin = String(computeDurationMinutes(updatedP.start, updatedP.end) || "")
          }
        }
        if (patch.start !== undefined || patch.end !== undefined || patch.totalMin !== undefined) {
          if (updatedP.subRows.length > 0) {
            const hideTime = rowSettings.hideTime
            const parentMin = hideTime
              ? (Number(updatedP.totalMin) || 0)
              : (Number(computeDurationMinutes(updatedP.start, updatedP.end)) || Number(updatedP.totalMin) || 0)
            const subTotalMin = updatedP.subRows.reduce((sum, s) => sum + (Number(s.totalMin) || Number(computeDurationMinutes(s.start, s.end)) || 0), 0)
            if (subTotalMin > parentMin) {
              toast.error(`Parent total is ${parentMin} mins . Child total should not exceed the parent time.`, { id: `val-${id}` })
              if (!hideTime) updatedP.end = ""
            }
          }
        }
        return updatedP
      })
      return next
    })
  }, [getRowSettings])

  const updateSubRow = (parentId: string, subRowId: string, updates: Partial<TimeEntrySubRow>) => {
    if (isLocked) return
    setParents((prev) =>
      prev.map((p) => {
        if (p.id !== parentId) return p
        const rowSettings = getRowSettings(p)
        const newSubRows = p.subRows.map((s) => {
          if (s.id !== subRowId) return s
          const updated = { ...s, ...updates }
          if (updates.start || updates.end) {
            updated.totalMin = String(computeDurationMinutes(updated.start, updated.end))
          } else if (updates.totalMin !== undefined) {
            const mins = Number(updates.totalMin) || 0
            if (!rowSettings.removeAutoFillEndTime) {
              updated.end = addMinutesToTime(updated.start, mins)
            }
          }
          return updated
        })
        if (updates.end || updates.start || updates.totalMin) {
          const hideTime = rowSettings.hideTime
          const parentMinutes = hideTime
            ? (Number(p.totalMin) || 0)
            : (Number(computeDurationMinutes(p.start, p.end)) || Number(p.totalMin) || 0)
          const subTotalMinutes = newSubRows.reduce((acc, s) => acc + (Number(s.totalMin) || 0), 0)
          if (subTotalMinutes > parentMinutes) {
            toast.error(`Parent total is ${parentMinutes} mins. Child total should not exceed the parent time.`)
            return p
          }
        }
        return { ...p, subRows: newSubRows }
      })
    )
  }

  const addParentAtTop = useCallback(() => {
    const topParent = parents[0]
    const newP = createParent()
    if (topParent) {
      newP.start = topParent.end || ""
      const rowSettings = getRowSettings(newP)
      if (newP.start && !rowSettings.removeAutoFillEndTime) {
        newP.end = addMinutesToTime(newP.start, 15)
      }
    }
    setParents((prev) => [newP, ...prev])
  }, [parents, getRowSettings])

  const removeParent = useCallback((id: string) => {
    const p = parents.find((row) => row.id === id)
    if (p?.dbId) onDelete?.(p.dbId)
    setParents((prev) => {
      const filtered = prev.filter((p) => p.id !== id)
      return filtered.length > 0 ? filtered : [createParent()]
    })
  }, [parents, onDelete])

  const addSubRow = useCallback((parentId: string) => {
    const parent = parents.find((p) => p.id === parentId)
    if (!parent) return
    const deptId = parent.departmentId
      ? Number(parent.departmentId)
      : resolveDepartmentIdForProgram(parent.tsProgram)
    const userMultiCode = apportioningConfig?.userMultiCode ?? []
    if (!deptId || !userMultiCode.some(item => Number(item.departmentId) === Number(deptId))) return
    if (deptId) fetchMulticodeProgramsForDepartment(deptId)
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      return { ...p, subRows: [...p.subRows, createSubRow()] }
    }))
  }, [parents, resolveDepartmentIdForProgram, fetchMulticodeProgramsForDepartment, apportioningConfig?.userMultiCode])

  const removeSubRow = useCallback((parentId: string, subId: string) => {
    const parent = parents.find((p) => p.id === parentId)
    if (parent) {
      const sub = parent.subRows.find((s) => s.id === subId)
      if (sub?.dbId) onDelete?.(sub.dbId)
    }
    setParents((prev) => prev.map((p) => (p.id === parentId ? { ...p, subRows: p.subRows.filter((s) => s.id !== subId) } : p)))
  }, [parents, onDelete])

  const canDeleteParent = (parentId: string) => {
    if (isLocked) return false
    const parent = parents.find((p) => p.id === parentId)
    if (parent?.isLeave || parent?.leaveid || parent?.apportioning) return false
    return parents.length > 1 || !!parent?.dbId
  }

  const isParentChanged = (current: TimeEntryParentRow, snapshot: TimeEntryParentRow | undefined): boolean => {
    if (!snapshot) return true
    if (
      current.start !== snapshot.start ||
      current.end !== snapshot.end ||
      current.totalMin !== snapshot.totalMin ||
      current.tsProgram !== snapshot.tsProgram ||
      current.serviceActivity !== snapshot.serviceActivity ||
      current.description !== snapshot.description ||
      current.subRows.length !== snapshot.subRows.length ||
      current.supportingDocs.some(d => d.file instanceof File)
    ) return true
    return current.subRows.some((sr, i) => {
      const snapSr = snapshot.subRows[i]
      if (!snapSr) return true
      return (
        sr.studyProgram !== snapSr.studyProgram ||
        sr.serviceActivity !== snapSr.serviceActivity ||
        sr.totalMin !== snapSr.totalMin ||
        sr.description !== snapSr.description ||
        sr.start !== snapSr.start ||
        sr.end !== snapSr.end
      )
    })
  }

  const mapToPayload = (overrideStatus?: string, changedOnly = false): any[] => {
    const deptId = dropdownData?.[0]?.departmentId
    return parents
      .filter((p) => {
        if (p.isLeave || p.leaveid) return false
        if (p.apportioning) {
          const isManual = p.apportioningType?.toUpperCase() === "MANUAL"
          const isRejectedOrOpened = ["rejected", "opened"].includes(p.status?.toLowerCase() ?? "")
          return isManual && isRejectedOrOpened
        }
        return true
      })
      .filter((p) => {
        if (!changedOnly) return true
        if (!p.dbId) return true
        const snap = parentsSnapshotRef.current.find(s => s.dbId === p.dbId)
        return isParentChanged(p, snap)
      })
      .map((p) => {
        const hideTime = resolveEffectiveHideTime(p)
        const decimalTotalMin = hideTime ? roundDecimalHoursToQuarterHour(p.totalMin ?? "") : p.totalMin
        return {
          id: p.dbId,
          userId,
          username,
          date: dateStr,
          starttime: hideTime ? null : (p.start || null),
          endtime: hideTime ? null : (p.end || null),
          activitytime: hideTime
            ? (Number(decimalTotalMin) || 0)
            : (p.dbId && !p.isEdited)
              ? (Number(p.totalMin) || 0)
              : (Number(computeDurationMinutes(p.start, p.end)) || Number(p.totalMin) || 0),
          programid: p.tsProgram,
          activityid: p.serviceActivity,
          description: p.description,
          departmentId: resolveDepartmentIdForProgram(p.tsProgram) || deptId,
          supportingDocs: p.supportingDocs,
          status: overrideStatus || p.status || "draft",
          recordType: p.recordType || "NORMAL",
          apportioning: p.apportioning || undefined,
          apportioningDesc: p.apportioning ? p.description : undefined,
          multiCodeRecords: p.subRows.map((s) => {
            const subDeptId = resolveDepartmentIdForProgram(s.studyProgram)
            const subUsesDecimal = hideTime || !!s.activityTimeMessage
            const decimalSubMin = subUsesDecimal ? roundDecimalHoursToQuarterHour(s.totalMin) : s.totalMin
            return {
              id: s.dbId,
              programid: s.studyProgram,
              activityid: s.serviceActivity,
              activitytime: Number(subUsesDecimal ? decimalSubMin : s.totalMin) || Number(computeDurationMinutes(s.start, s.end)) || 0,
              description: s.description,
              departmentId: subDeptId,
              starttime: hideTime ? null : (s.start || null),
              endtime: hideTime ? null : (s.end || null),
              recordType: "MULTI_CODE",
              status: overrideStatus || s.status || p.status || "draft",
            }
          }),
        }
      })
  }

  const validateEntries = () => {
    for (const p of parents) {
      if (p.isLeave || p.leaveid) continue
      if (p.apportioning) {
        const isManual = p.apportioningType?.toUpperCase() === "MANUAL"
        const isRejectedOrOpened = ["rejected", "opened"].includes(p.status?.toLowerCase() ?? "")
        if (!(isManual && isRejectedOrOpened)) continue
      }
      const hideTime = resolveEffectiveHideTime(p)
      if (hideTime) {
        if (!p.totalMin || !p.tsProgram || !p.serviceActivity) {
          toast.error("Please fill all the required fields")
          return false
        }
      } else {
        if (!p.start || !p.end || !p.tsProgram || !p.serviceActivity) {
          toast.error("Please fill all the required fields")
          return false
        }
      }
      if (p.subRows.length > 0) {
        const parentMin = hideTime
          ? (Number(p.totalMin) || 0)
          : (Number(computeDurationMinutes(p.start, p.end)) || Number(p.totalMin) || 0)
        let subTotalMin = 0
        for (const s of p.subRows) {
          if (!s.totalMin || !s.studyProgram || !s.serviceActivity) {
            toast.error("Please fill all the required fields in sub-rows")
            return false
          }
          subTotalMin += Number(s.totalMin) || 0
        }
        if (subTotalMin > parentMin) {
          toast.error(`Total sub-row minutes (${subTotalMin}) cannot exceed parent minutes (${parentMin})`)
          return false
        }
      }
      if (!p.isLeave && !p.leaveid && leaveRecords && leaveRecords.length > 0) {
        const BLOCKING_STATUSES = ["draft", "requested", "approved"]
        const parseT = (t: string): number | null => {
          if (!t) return null
          const parts = t.trim().split(":")
          if (parts.length < 2) return null
          const h = Number(parts[0])
          const m = Number(parts[1])
          if (isNaN(h) || isNaN(m)) return null
          return h * 60 + m
        }
        const entryStart = parseT(p.start)
        const entryEnd = parseT(p.end)
        if (entryStart !== null && entryEnd !== null) {
          for (const leave of leaveRecords) {
            const status = (leave.status ?? "").toLowerCase()
            if (!BLOCKING_STATUSES.includes(status)) continue
            const leaveStart = parseT(leave.starttime)
            const leaveEnd = parseT(leave.endtime)
            if (leaveStart === null || leaveEnd === null) continue
            if (entryStart < leaveEnd && leaveStart < entryEnd) {
              const fmt = (mins: number) =>
                `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
              toast.error(
                `Time entry (${fmt(entryStart)}–${fmt(entryEnd)}) overlaps with a ${status.charAt(0).toUpperCase() + status.slice(1)} leave request (${fmt(leaveStart)}–${fmt(leaveEnd)}). Please adjust the entry time.`
              )
              return false
            }
          }
        }
      }
    }
    return true
  }

  const handleSave = () => {
    if (!validateEntries()) return
    const hasServerRecords = parentsSnapshotRef.current.length > 0
    if (hasServerRecords) {
      const editableParents = parents.filter(p => {
        if (p.isLeave || p.leaveid) return false
        if (p.apportioning) {
          const isManual = p.apportioningType?.toUpperCase() === "MANUAL"
          const isRejectedOrOpened = ["rejected", "opened"].includes(p.status?.toLowerCase() ?? "")
          return isManual && isRejectedOrOpened
        }
        return true
      })
      const hasChanges = editableParents.some(p => {
        if (!p.dbId) return true
        const snap = parentsSnapshotRef.current.find(s => s.dbId === p.dbId)
        return isParentChanged(p, snap)
      })
      if (!hasChanges) {
        toast.warning("No changes to save", {
          position: "top-center",
          className: "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        })
        return
      }
    }
    const payload = mapToPayload("draft", hasServerRecords)
    if (payload.length === 0) {
      toast.error("Please add at least one time entry")
      return
    }
    onSave?.(payload)
  }

  const handleSubmitInternal = () => {
    if (!validateEntries()) return
    const payload = mapToPayload("submitted")
    if (payload.length === 0) {
      toast.error("Please add at least one time entry")
      return
    }
    onSubmit?.(payload)
    parkPersonalTimeStudyFocusSoon()
  }

  const handleAddDocs = (parentId: string, files: FileList) => {
    const fileArray = Array.from(files)
    const parentRow = parents.find((p) => p.id === parentId)
    const newDocs = fileArray.map((f) => ({ name: f.name, url: URL.createObjectURL(f), file: f }))
    updateParent(parentId, { supportingDocs: [...(parentRow?.supportingDocs ?? []), ...newDocs] })
  }

  const handleDeleteDoc = (parentId: string, name: string) => {
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      const removed = p.supportingDocs.find((d) => d.name === name)
      if (removed) {
        if (removed.file) URL.revokeObjectURL(removed.url)
        const parent = p
        if (!removed.file && removed.docId) {
          const parentDbId = parent.dbId
          if (parentDbId) apiDeleteSupportingDoc(parentDbId, removed.docId).catch(() => { })
        }
      }
      return { ...p, supportingDocs: p.supportingDocs.filter((d) => d.name !== name) }
    }))
  }

  const handleDownloadDoc = async (parentId: string, doc: any) => {
    if (doc.file) {
      const link = document.createElement("a")
      link.href = doc.url
      link.download = doc.name
      link.click()
      return
    }
    const parent = parents.find(p => p.id === parentId)
    if (!parent?.dbId) {
      toast.error("Please save the record before downloading.")
      return
    }
    try {
      const blob = await apiDownloadSupportingDoc(parent.dbId, doc.docId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(err.message || "Download failed")
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <section
      className={cn(
        "relative w-full rounded-[6px] border-0 bg-white dark:bg-zinc-950 p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]",
        className,
      )}
    >
      <span ref={focusSinkRef} tabIndex={-1} data-pts-focus-sink aria-hidden="true" className="sr-only" />

      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-[6px]">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}

      {/* ── Header: Title + Summary + Buttons ── */}
      <div className="mb-4 flex flex-col gap-2">
        {showLeaveBanner && leaveRecords && (() => {
          const filtered = leaveRecords.filter(l => ["approved", "requested", "draft"].includes(l.status?.toLowerCase() ?? ""))
          if (!filtered.length) return null
          return (
            <div className="mt-5 mb-1 flex flex-wrap justify-center gap-4">
              {filtered.map((leave, idx) => (
                <div key={idx} className="rounded-[6px] bg-[#E2E8F0]/50 dark:bg-zinc-900 px-4 py-1.5 text-[13px] text-gray-600 dark:text-zinc-300 italic text-center border border-[#CBD5E1] dark:border-zinc-800 flex items-center justify-center gap-2 w-fit">
                  <span>
                    {readonly ? (leave.name || leave.employeeName || username) : "You"} applied leave in this date : <span className="not-italic font-medium text-gray-800 dark:text-zinc-100">({dateStr})</span> from : <span className="not-italic font-medium text-gray-800 dark:text-zinc-100">({(leave.starttime || "").slice(0, 5)})</span> To : <span className="not-italic font-medium text-gray-800 dark:text-zinc-100">({(leave.endtime || "").slice(0, 5)})</span>. <strong className="not-italic font-semibold text-gray-700 dark:text-zinc-200">Status:</strong>
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-[6px] text-[11px] border bg-white capitalize font-semibold not-italic shrink-0 select-none",
                    leave.status?.toLowerCase() === "approved" ? "border-green-500 text-green-600 bg-green-50/50" :
                      leave.status?.toLowerCase() === "rejected" ? "border-red-500 text-red-500 bg-red-50/50" :
                        "border-[#f59e0b] text-[#d97706] bg-amber-50/50"
                  )}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[14px] text-[#6C5DD3] font-semibold">Time Entries</h3>

          {!hideSummaryHeader && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              <div className="flex items-center gap-1"><span className="text-gray-600">Allocated:</span><span className="font-semibold text-[#6C5DD3]">{allocatedTotal || 0}</span></div>
              <div className="flex items-center gap-1"><span className="text-gray-600">Entered:</span><span className="font-semibold text-[#6C5DD3]">{actualTotal || 0}</span></div>
              <div className="flex items-center gap-1"><span className="text-gray-600">Balance:</span><span className="font-semibold text-[#6C5DD3]">{balanceTotal || 0}</span></div>
              {actualMultiTotal !== null && actualMultiTotal !== undefined && (
                <div className="flex items-center gap-1"><span className="text-gray-600">MAA Entered:</span><span className="font-semibold text-[#6C5DD3]">{actualMultiTotal || 0}</span></div>
              )}
              {multiBalanceTotal !== null && multiBalanceTotal !== undefined && (
                <div className="flex items-center gap-1"><span className="text-gray-600">MAA Balance:</span><span className="font-semibold text-[#6C5DD3]">{multiBalanceTotal || 0}</span></div>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center justify-end gap-2">
            {apportioningConfig?.supervisorApportioning && !hideApportioningInfo && (
              apportioningSummary && apportioningSummary.length > 0 ? (
                <Popover open={openApportioning} onOpenChange={setOpenApportioning}>
                  <HoverCard openDelay={0} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <PopoverTrigger asChild>
                        <div
                          onClick={() => setOpenApportioning((prev) => !prev)}
                          className="flex items-center gap-2 bg-[#F8F9FA] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 px-3 py-1.5 rounded-[6px] h-9 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors select-none"
                        >
                          <div className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[#6C5DD3] bg-[#6C5DD3] text-white opacity-50 cursor-pointer">
                            <Check className="size-3 stroke-[3]" />
                          </div>
                          <Label className="text-[12px] text-[#344054] dark:text-zinc-200 font-semibold cursor-pointer select-none">
                            Apportioning
                          </Label>
                          <div className="text-blue-500 hover:text-blue-600 transition-colors flex items-center shrink-0">
                            <AlertCircle className="size-3.5" />
                          </div>
                        </div>
                      </PopoverTrigger>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-fit min-w-[260px] sm:min-w-[300px] max-w-[280px] sm:max-w-sm p-2.5 sm:p-3 z-[100] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl rounded-[8px]" align="end" side="top">
                      <div className="text-[10px] sm:text-[11px] font-medium space-y-2">
                        {apportioningSummary.map((item) => (
                          <div key={item.departmentId} className="border-b last:border-b-0 pb-2 last:pb-0 border-gray-100 dark:border-zinc-800">
                            <div className="font-bold text-[#6C5DD3] text-[11px] sm:text-[12px]">{item.departmentName}</div>
                            <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-0.5 mt-1 text-[#344054] dark:text-zinc-300">
                              {item.startDate && <div><span className="text-muted-foreground">Start:</span> <span className="font-semibold">{item.startDate}</span></div>}
                              {item.endDate && <div><span className="text-muted-foreground">End:</span> <span className="font-semibold">{item.endDate}</span></div>}
                              <div><span className="text-muted-foreground">Percent:</span> <span className="font-semibold">{item.apportioningPercent}%</span></div>
                              <div><span className="text-muted-foreground">Allocated:</span> <span className="font-semibold">{item.allocatedMinutes} Min.</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </HoverCardContent>
                    <PopoverContent className="w-fit min-w-[260px] sm:min-w-[300px] max-w-[280px] sm:max-w-sm p-2.5 sm:p-3 z-[100] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-xl rounded-[8px]" align="end" side="top">
                      <div className="text-[10px] sm:text-[11px] font-medium space-y-2">
                        {apportioningSummary.map((item) => (
                          <div key={item.departmentId} className="border-b last:border-b-0 pb-2 last:pb-0 border-gray-100 dark:border-zinc-800">
                            <div className="font-bold text-[#6C5DD3] text-[11px] sm:text-[12px]">{item.departmentName}</div>
                            <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-0.5 mt-1 text-[#344054] dark:text-zinc-300">
                              {item.startDate && <div><span className="text-muted-foreground">Start:</span> <span className="font-semibold">{item.startDate}</span></div>}
                              {item.endDate && <div><span className="text-muted-foreground">End:</span> <span className="font-semibold">{item.endDate}</span></div>}
                              <div><span className="text-muted-foreground">Percent:</span> <span className="font-semibold">{item.apportioningPercent}%</span></div>
                              <div><span className="text-muted-foreground">Allocated:</span> <span className="font-semibold">{item.allocatedMinutes} Min.</span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </HoverCard>
                </Popover>
              ) : (
                <div className="flex items-center gap-2 bg-[#F8F9FA] dark:bg-zinc-900 border border-[#E2E8F0] dark:border-zinc-800 px-3 py-1.5 rounded-[6px] h-9">
                  <div className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[#6C5DD3] bg-[#6C5DD3] text-white opacity-50 cursor-not-allowed">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                  <Label className="text-[12px] text-[#344054] dark:text-zinc-200 font-semibold cursor-not-allowed select-none">Apportioning</Label>
                </div>
              )
            )}
            {!readonly && moveSaveSubmitToTop && (
              <div className="flex items-center gap-2">
                <Button
                  tabIndex={-1}
                  data-pts-save-top
                  disabled={isLocked || allIsLeave}
                  className={cn("h-9 px-4 bg-[#6C5DD3] hover:bg-[#5B4DBF] text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  tabIndex={-1}
                  data-pts-submit-top
                  disabled={isLocked || allIsLeave}
                  className={cn("h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")}
                  onClick={() => setShowSubmitConfirm(true)}
                >
                  Submit
                </Button>
              </div>
            )}
            {!readonly && apportioningConfig?.allowUserEntry === false && hideApportioningInfo && onOpenPeriodsSheet && (
              <button
                type="button"
                tabIndex={-1}
                onClick={onOpenPeriodsSheet}
                className="h-9 flex items-center gap-3.5 rounded-[8px] bg-white text-[#6C5DD3] border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors shrink-0 px-3 py-1.5"
              >
                <span className="text-[11px] font-semibold text-gray-500 select-none">Note: Click on the warning icon to view why the time entry is blocked</span>
                <AlertTriangle className="size-6 text-[#F97316] animate-pulse shrink-0" />
              </button>
            )}
            {!readonly && (
              <Button
                size="icon"
                disabled={isLocked}
                aria-label="Add time entry row"
                data-pts-purple-add
                className={cn("size-9 bg-[#6C5DD3] hover:bg-[#6C5DD3]/90 shrink-0", isLocked && "cursor-not-allowed")}
                onClick={addParentAtTop}
              >
                <Plus className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Entry Cards ── */}
      <div className="flex flex-col gap-4" data-time-entries-form data-pts-tab-scope>
        {parents.map((parent) => {
          const totalDisplay = computeDurationMinutes(parent.start, parent.end)
          const isLeaveRow = parent.isLeave
          const isManualApportioningRejectedOrOpened =
            parent.apportioning === true &&
            parent.apportioningType?.toUpperCase() === "MANUAL" &&
            ["rejected", "opened", "draft"].includes(parent.status?.toLowerCase() ?? "")
          const isApportionedRow = parent.apportioning === true && !isManualApportioningRejectedOrOpened
          const rowSettings = getRowSettings(parent)
          const effectiveHideTime = resolveEffectiveHideTime(parent)
          const hideDocs = rowSettings.hideSupportingDoc
          const hideNotes = rowSettings.hideDescriptionActivityNote
          const showGreenPlus = !readonly && !isLeaveRow && !parent.apportioning && isMulticodeAllowedForParent(parent)
          const showDelete = !readonly && canDeleteParent(parent.id)

          return (
            <div key={parent.id} className={parentCardClass} data-pts-row={parent.id}>
              {/* TS Program — full width, no action buttons here */}
              <div className="space-y-0.5">
                <Label className="text-[11px] text-[#6C5DD3] font-medium">TS Program <RequiredMark /></Label>
                <SingleSelectSearchDropdown
                  value={parent.tsProgram}
                  placeholder="Select program"
                  disabled={isLocked || isLeaveRow || isApportionedRow}
                  title={(!apportioningConfig?.timestudyAllowedDepartmentIds || apportioningConfig.timestudyAllowedDepartmentIds.length === 0) && !apportioningConfig?.bypassSchedule ? "No Time Study period Allocated" : undefined}
                  isLoading={isDropdownLoading}
                  onOpenChange={(open) => { if (open) onOpenDropdown?.() }}
                  options={(() => {
                    const filtered = programs
                      .filter((p: any) => !p.isMultiCode)
                      .map((p: any) => {
                        const deptPrefix = (p.departmentCode ?? '').split('-')[0]
                        return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
                      })
                    if (parent.tsProgram && !filtered.some((o) => o.value === parent.tsProgram)) {
                      if (parent.programCode || parent.programName) {
                        const deptPrefix = (parent.departmentCode ?? '').split('-')[0]
                        const prefix = deptPrefix ? `${deptPrefix}-` : ''
                        filtered.unshift({ value: parent.tsProgram, label: `${prefix}${parent.programCode ?? ''} - ${parent.programName ?? ''}` })
                      }
                    }
                    return filtered
                  })()}
                  onChange={(v) => {
                    const newDeptId = resolveDepartmentIdForProgram(v)
                    if (v !== parent.tsProgram) {
                      updateParent(parent.id, { tsProgram: v, serviceActivity: '', departmentId: newDeptId })
                    } else {
                      updateParent(parent.id, { tsProgram: v, departmentId: newDeptId })
                    }
                    fetchActivitiesForProgram(v, newDeptId)
                    checkAndRefetchConfig(v)
                  }}
                  onBlur={() => { }}
                  className={cn("h-10 text-[11px]", (isLocked || isLeaveRow || isApportionedRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                />
              </div>

              {/* Service / Activity Code */}
              <div className="space-y-0.5">
                <Label className="text-[11px] text-[#6C5DD3] font-medium">Service / Activity Code <RequiredMark /></Label>
                <SingleSelectSearchDropdown
                  value={parent.serviceActivity}
                  placeholder="Select Activity Code"
                  disabled={isLocked || isLeaveRow || isApportionedRow || !parent.tsProgram}
                  isLoading={isFetchingActivitiesForProgram(parent.tsProgram, parent.departmentId)}
                  onOpenChange={(open) => {
                    if (open && parent.tsProgram) fetchActivitiesForProgram(parent.tsProgram, parent.departmentId)
                  }}
                  options={(() => {
                    if (!parent.tsProgram) return []
                    const deptId = resolveDepartmentIdForProgram(parent.tsProgram) ?? parent.departmentId
                    const key = deptId ? `${deptId}:${parent.tsProgram}` : ""
                    const listForProg = key ? (programActivities[key] ?? []) : []
                    const filtered = listForProg.map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))
                    if (parent.serviceActivity && !filtered.some((o) => o.value === parent.serviceActivity)) {
                      const fallback = listForProg.find((a: any) => String(a.id) === parent.serviceActivity) as any
                      if (fallback) {
                        filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` })
                      } else if (parent.activityCode || parent.activityName) {
                        filtered.unshift({ value: parent.serviceActivity, label: `${parent.activityCode ?? ''} - ${parent.activityName ?? ''}` })
                      }
                    }
                    return filtered
                  })()}
                  onChange={(v) => updateParent(parent.id, { serviceActivity: v })}
                  onBlur={() => { }}
                  className={cn("h-10 text-[11px]", (isLocked || isLeaveRow || isApportionedRow || !parent.tsProgram) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                />
              </div>

              {/* Start + End time pickers in 2-column grid */}
              {!effectiveHideTime && (
                <div className="grid grid-cols-2 gap-2.5">
                  <TimePicker24h
                    label="Start"
                    value={parent.start}
                    disabled={isLocked || isLeaveRow || isApportionedRow}
                    isLeave={isLeaveRow}
                    isApportioned={isApportionedRow}
                    onChange={(v) => updateParent(parent.id, { start: v })}
                  />
                  <TimePicker24h
                    label="End"
                    value={parent.end}
                    disabled={isLocked || isLeaveRow || isApportionedRow || !parent.start}
                    isLeave={isLeaveRow}
                    isApportioned={isApportionedRow}
                    onChange={(v) => updateParent(parent.id, { end: v })}
                  />
                </div>
              )}

              {/* Action buttons (delete/+) shared dynamically with last visible field.
                  Priority (last wins): Supporting doc → Description → Min./Hrs. */}
              {(() => {
                const parentActionBtns = (showDelete || showGreenPlus) && (
                  <div className="flex items-end gap-1 pb-0.5 shrink-0">
                    {showDelete && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isLocked}
                        aria-label="Delete time entry row"
                        className={cn("size-9 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")}
                        onClick={() => removeParent(parent.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    {showGreenPlus && (
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={isLocked}
                        className={cn("size-9 border-green-600 text-green-600 hover:bg-green-600/10", isLocked && "cursor-not-allowed")}
                        onClick={() => addSubRow(parent.id)}
                        aria-label="Add multi-code row"
                      >
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                )

                // Min. / Hrs. field node function — accepts isStandalone
                const renderMinField = (isStandalone = false) => effectiveHideTime ? (
                  <div className={cn("w-full", isStandalone ? "" : "flex-1")}>
                    <MinDecimalField
                      label={<>Hrs. <RequiredMark /></>}
                      labelClassName="text-[11px] text-muted-foreground"
                      value={parent.totalMin ?? ""}
                      readOnly={isLocked || isLeaveRow || isApportionedRow}
                      showDecimalHint
                      hintMessage={parent.activityTimeMessage}
                      containerClassName={isStandalone ? "!max-w-none w-full" : "!max-w-none flex-1"}
                      inputClassName={cn(isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                      onChange={(v) => updateParent(parent.id, { totalMin: v })}
                    />
                  </div>
                ) : (
                  <div className={cn("space-y-0.5 w-full", isStandalone ? "" : "flex-1")}>
                    <Label className="text-[11px] text-muted-foreground">Min. <RequiredMark /></Label>
                    <TitleCaseInput
                      type="number"
                      min="0"
                      readOnly={isLocked || isLeaveRow || isApportionedRow}
                      value={parent.totalMin !== undefined && parent.totalMin !== "" ? parent.totalMin : (totalDisplay || "")}
                      placeholder="—"
                      className={cn(
                        "h-10 text-[11px] bg-[#F2F4F7] cursor-not-allowed w-full",
                        isLeaveRow && "border-yellow-400",
                        isApportionedRow && "border-[#6C5DD3]",
                      )}
                    />
                  </div>
                )

                if (!hideDocs) {
                  /* Supporting doc is last — Min. standalone, Description standalone (if shown),
                     then Supporting doc row shared with action buttons */
                  return (
                    <>
                      {renderMinField(true)}
                      {!hideNotes && (
                        <div className="space-y-0.5 w-full">
                          <Label className="text-[11px] text-muted-foreground">Description</Label>
                          <TitleCaseInput
                            data-pts-desc={parent.id}
                            value={parent.description}
                            readOnly={isLocked || isLeaveRow || isApportionedRow}
                            onChange={(e) => updateParent(parent.id, { description: e.target.value })}
                            placeholder="Add description here..."
                            className={cn("h-10 text-[11px] text-[#344054] dark:text-zinc-100 font-normal w-full bg-white dark:bg-transparent", (isLocked || isLeaveRow || isApportionedRow) && "!bg-[#F2F4F7] dark:!bg-zinc-800/80 cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                          />
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <SupportingDocField
                            parentId={parent.id}
                            docs={parent.supportingDocs}
                            uploading={false}
                            disabled={isLocked || isLeaveRow || isApportionedRow}
                            isLeave={isLeaveRow}
                            isApportioned={isApportionedRow}
                            onAdd={handleAddDocs}
                            onDelete={handleDeleteDoc}
                            onDownload={handleDownloadDoc}
                          />
                        </div>
                        {parentActionBtns}
                      </div>
                    </>
                  )
                }

                if (!hideNotes) {
                  /* Supporting doc hidden; Description is last — Min. standalone,
                     then Description row shared with action buttons */
                  return (
                    <>
                      {renderMinField(true)}
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-0.5">
                          <Label className="text-[11px] text-muted-foreground">Description</Label>
                          <TitleCaseInput
                            data-pts-desc={parent.id}
                            value={parent.description}
                            readOnly={isLocked || isLeaveRow || isApportionedRow}
                            onChange={(e) => updateParent(parent.id, { description: e.target.value })}
                            placeholder="Add description here..."
                            className={cn("h-10 text-[11px] text-[#344054] dark:text-zinc-100 font-normal w-full bg-white dark:bg-transparent", (isLocked || isLeaveRow || isApportionedRow) && "!bg-[#F2F4F7] dark:!bg-zinc-800/80 cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                          />
                        </div>
                        {parentActionBtns}
                      </div>
                    </>
                  )
                }

                /* Both hidden; Min. / Hrs. is the last field — share it with action buttons */
                return (
                  <div className="flex items-end gap-2">
                    {renderMinField(false)}
                    {parentActionBtns}
                  </div>
                )
              })()}

              {/* ── Child multicode sub-row cards ── */}
              {parent.subRows.length > 0 && (
                <div className="flex flex-col gap-4 mt-3 border-l-2 border-[#6C5DD3]/40 pl-5 ml-5">
                  {parent.subRows.map((sub) => {
                    const parentDeptId = resolveDepartmentIdForProgram(parent.tsProgram) ?? parent.departmentId
                    const hideSubNotes = getRowSettings(parent).hideDescriptionActivityNote
                    return (
                      <div key={sub.id} className={childCardClass}>
                        {/* Program — full width, no delete button here */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Program <RequiredMark /></Label>
                          <SingleSelectSearchDropdown
                            value={sub.studyProgram}
                            placeholder="Select program"
                            disabled={isLocked || isLeaveRow || isApportionedRow}
                            isLoading={(() => {
                              const deptId = resolveDepartmentIdForProgram(parent.tsProgram)
                              return Boolean(deptId && fetchingDepartments[String(deptId)])
                            })()}
                            onOpenChange={(open) => {
                              if (open) {
                                onOpenDropdown?.()
                                const deptId = resolveDepartmentIdForProgram(parent.tsProgram)
                                if (deptId) fetchMulticodeProgramsForDepartment(deptId)
                              }
                            }}
                            options={(() => {
                              const filtered = [...getSubRowProgramOptions(parent.tsProgram)]
                              if (sub.studyProgram && !filtered.some((o) => o.value === sub.studyProgram)) {
                                if (sub.programCode || sub.programName) {
                                  const deptPrefix = (sub.departmentCode ?? "").split("-")[0]
                                  const prefix = deptPrefix ? `${deptPrefix}-` : ""
                                  filtered.unshift({ value: sub.studyProgram, label: `${prefix}${sub.programCode ?? ""} - ${sub.programName ?? ""}` })
                                }
                              }
                              return filtered
                            })()}
                            onChange={(v) => {
                              if (v !== sub.studyProgram) {
                                updateSubRow(parent.id, sub.id, { studyProgram: v, serviceActivity: "" })
                              } else {
                                updateSubRow(parent.id, sub.id, { studyProgram: v })
                              }
                              fetchActivitiesForProgram(v)
                              checkAndRefetchConfig(v)
                            }}
                            onBlur={() => { }}
                            className={cn("h-9 text-[11px]", (isLocked || isLeaveRow || isApportionedRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                          />
                        </div>

                        {/* Activity Code */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Activity Code <RequiredMark /></Label>
                          <SingleSelectSearchDropdown
                            value={sub.serviceActivity}
                            placeholder="Select Activity Code"
                            disabled={isLocked || isLeaveRow || isApportionedRow || !sub.studyProgram}
                            isLoading={isFetchingActivitiesForProgram(sub.studyProgram, parentDeptId)}
                            onOpenChange={(open) => {
                              if (open && sub.studyProgram) fetchActivitiesForProgram(sub.studyProgram, parentDeptId)
                            }}
                            options={(() => {
                              if (!sub.studyProgram) return []
                              const deptId = parentDeptId
                              const key = deptId ? `${deptId}:${sub.studyProgram}` : ""
                              const listForProg = key ? (programActivities[key] ?? []) : []
                              const filtered = listForProg.map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))
                              if (sub.serviceActivity && !filtered.some((o) => o.value === sub.serviceActivity)) {
                                const fallback = listForProg.find((a: any) => String(a.id) === sub.serviceActivity) as any
                                if (fallback) {
                                  filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` })
                                } else if (sub.activityCode || sub.activityName) {
                                  filtered.unshift({ value: sub.serviceActivity, label: `${sub.activityCode ?? ""} - ${sub.activityName ?? ""}` })
                                }
                              }
                              return filtered
                            })()}
                            onChange={(v) => updateSubRow(parent.id, sub.id, { serviceActivity: v })}
                            onBlur={() => { }}
                            className={cn("h-9 text-[11px]", (isLocked || isLeaveRow || isApportionedRow || !sub.studyProgram) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                          />
                        </div>

                        {/* Delete button — shared on last row with whichever field is last */}
                        {(() => {
                          const childDeleteBtn = !readonly && !isLeaveRow && !isApportionedRow && (
                            <div className="flex items-end pb-0.5 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={isLocked}
                                className={cn("size-9 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")}
                                onClick={() => removeSubRow(parent.id, sub.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          )

                          if (hideSubNotes) {
                            /* Min. / Hrs. is the last field — share bottom row with delete */
                            return (
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <MinDecimalField
                                    label={<>{(effectiveHideTime || !!sub.activityTimeMessage) ? "Hrs." : "Min."} <RequiredMark /></>}
                                    labelClassName="text-[11px] text-[#6C5DD3] font-medium"
                                    value={sub.totalMin}
                                    readOnly={isLocked || isLeaveRow || isApportionedRow}
                                    showDecimalHint={effectiveHideTime || !!sub.activityTimeMessage}
                                    hintMessage={sub.activityTimeMessage}
                                    heightClass="h-9"
                                    inputClassName={cn(isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                                    onChange={(v) => updateSubRow(parent.id, sub.id, { totalMin: v })}
                                  />
                                </div>
                                {childDeleteBtn}
                              </div>
                            )
                          }

                          /* Description is the last field — Min. above it, then share Description row with delete */
                          return (
                            <>
                              <MinDecimalField
                                label={<>{(effectiveHideTime || !!sub.activityTimeMessage) ? "Hrs." : "Min."} <RequiredMark /></>}
                                labelClassName="text-[11px] text-[#6C5DD3] font-medium"
                                value={sub.totalMin}
                                readOnly={isLocked || isLeaveRow || isApportionedRow}
                                showDecimalHint={effectiveHideTime || !!sub.activityTimeMessage}
                                hintMessage={sub.activityTimeMessage}
                                heightClass="h-9"
                                containerClassName="!max-w-none"
                                inputClassName={cn(isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                                onChange={(v) => updateSubRow(parent.id, sub.id, { totalMin: v })}
                              />
                              <div className="flex items-end gap-2">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-[11px] text-muted-foreground">Description</Label>
                                  <TitleCaseInput
                                    value={sub.description}
                                    readOnly={isLocked || isLeaveRow || isApportionedRow}
                                    onChange={(e) => updateSubRow(parent.id, sub.id, { description: e.target.value })}
                                    placeholder="Add description here..."
                                    className={cn("h-9 text-[11px] text-[#344054] dark:text-zinc-100 font-normal bg-white dark:bg-transparent", (isLocked || isLeaveRow || isApportionedRow) && "!bg-[#F2F4F7] dark:!bg-zinc-800/80 cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                                  />
                                </div>
                                {childDeleteBtn}
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Apportioning Panel ── */}
      <PersonalTimeStudyApportioningPanel
        apportioningConfig={apportioningConfig}
        supervisorOwnMinutesToday={actualTotal || 0}
        apportioningRecords={apportioningRecords}
        autoApportioning={apportioningConfig?.autoApportioning}
      />

      {/* ── Save / Submit buttons (bottom) ── */}
      {!readonly && (
        <div className={cn("mt-4 flex justify-end gap-2", moveSaveSubmitToTop && "sr-only")}>
          <Button
            disabled={isLocked || allIsLeave}
            data-pts-save
            tabIndex={moveSaveSubmitToTop ? -1 : undefined}
            className={cn("h-10 px-8 bg-[#6C5DD3] hover:bg-[#5B4DBF]", (isLocked || allIsLeave) && "cursor-not-allowed")}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            disabled={isLocked || allIsLeave}
            data-pts-submit
            tabIndex={moveSaveSubmitToTop ? -1 : undefined}
            className={cn("h-10 px-8 bg-green-600 hover:bg-green-700 text-white", (isLocked || allIsLeave) && "cursor-not-allowed")}
            onClick={() => setShowSubmitConfirm(true)}
          >
            Submit
          </Button>
        </div>
      )}

      {/* ── Submit confirmation dialog ── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[520px] rounded-[12px] bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-[16px] font-medium text-center">Are you sure, you want to lock the time and fully submit it?</h3>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="h-11 min-w-[100px] bg-[#F2F4F7]" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
              <Button
                className="h-11 min-w-[100px] bg-[#6C5DD3] text-white"
                onClick={() => {
                  parkPersonalTimeStudyFocus()
                  setShowSubmitConfirm(false)
                  handleSubmitInternal()
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
