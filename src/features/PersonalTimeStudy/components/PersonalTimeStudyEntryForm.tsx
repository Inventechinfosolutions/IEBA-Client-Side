import { ChevronDown, Clock, Eye, Plus, Trash2, Check, AlertCircle, AlertTriangle } from "lucide-react"
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react"
import type { UserAssignedDepartmentsSettingChecks } from "../queries/getUserAssignedDepartmentsSettingChecks"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"



import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { TimePickerDropdown } from "@/components/ui/time-picker"
import { PersonalTimeStudyApportioningPanel } from "./PersonalTimeStudyApportioningPanel"
import { useAuth } from "@/contexts/AuthContext"
import { API_BASE_URL } from "@/lib/config"
import {
  isEndTimeAfterStartTime,
} from "@/lib/dates"
import { apiDownloadSupportingDoc, apiDeleteSupportingDoc, apiGetUserActivitiesForProgram, apiGetUserProgramsAndActivitiesMulticode } from "../api/personalTimeStudyApi"
import { Spinner } from "@/components/ui/spinner"
import { normalizeMulticodeDropdownPayload } from "../utils/multicodeDropdownUtils"
import {
  buildDecimalMinMessage,
  DecimalActivityTimeHint,
  isQuarterHourDecimal,
  roundDecimalHoursToQuarterHour,
} from "../utils/decimalTimeHint.tsx"


import { formatTimeInput, normalizeTimeOnBlur } from "../utils/timeUtils"

/** Inline required-field asterisk — available to all components in this module. */
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
}: MinDecimalFieldProps) {
  const [originalValue, setOriginalValue] = useState<string | null>(null)

  const needsRounding = showDecimalHint && (
    (!!value.trim() && !isQuarterHourDecimal(value)) ||
    originalValue !== null
  )
  const displayMessage = showDecimalHint
    ? hintMessage ?? (
        originalValue !== null
          ? `${originalValue} hrs rounded to ${value} hrs (${Math.round(Number(value) * 60)} mins)`
          : (needsRounding ? buildDecimalMinMessage(value) : null)
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
    <div className={cn("space-y-0.5", showDecimalHint ? "w-[92px]" : "w-[60px]")}>
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

export type TimeEntrySubRow = {
  id: string
  dbId?: number
  studyProgram: string
  serviceActivity: string
  totalMin: string
  activityTimeMessage?: string | null
  description: string
  start: string
  end: string
  programCode?: string
  programName?: string
  activityCode?: string
  activityName?: string
  departmentCode?: string
  status?: string
  recordType?: string
}

export type TimeEntryParentRow = {
  id: string
  dbId?: number
  start: string
  end: string
  totalMin?: string
  activityTimeMessage?: string | null
  tsProgram: string
  serviceActivity: string
  description: string
  supportingDocLabel?: string
  supportingDocs: Array<{ name: string; url: string; file?: File; docId?: number }>
  subRows: TimeEntrySubRow[]
  programCode?: string
  programName?: string
  activityCode?: string
  activityName?: string
  departmentCode?: string
  departmentId?: number
  isLeave?: boolean
  apportioning?: boolean
  leaveid?: number
  status?: string
  recordType?: string
  isEdited?: boolean
}

export type TimeEntryRow = TimeEntryParentRow

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
  const d = eh * 60 + em - (sh * 60 + sm)
  if (d <= 0) return ""
  return String(d)
}

const END_TIME_AFTER_START_MSG = "End time must be after start time"

function assertEndAfterStartOrToast(
  start: string | undefined,
  end: string | undefined,
  toastId?: string,
): boolean {
  const result = isEndTimeAfterStartTime(start, end)
  if (result === false) {
    toast.error(END_TIME_AFTER_START_MSG, toastId ? { id: toastId } : undefined)
    return false
  }
  return true
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


type PersonalTimeStudyEntryFormProps = {
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
  /** Pre-calculated apportioning records from backend (apportioning=true TSRs). */
  apportioningRecords?: any[]
  apportioningSummary?: any[]
  isLoading?: boolean
  isDropdownLoading?: boolean
  onOpenDropdown?: () => void
  /** Lifted from parent so multicode cache survives date remounts. */
  departmentMulticodes?: Record<string, any[]>
  fetchingDepartments?: Record<string, boolean>
  onFetchMulticodeDept?: (deptId: string | number | undefined) => Promise<void>
  refetchConfig?: () => void
  hideApportioningInfo?: boolean
  onOpenPeriodsSheet?: () => void
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

  const openMenu = () => {
    if (!disabled) setOpen(true)
  }

  return (
    <div className="flex flex-col gap-1 w-[80px] shrink-0">
      <Label className="text-[11px] text-muted-foreground">
        {label} {required && <RequiredMark />}
      </Label>
      <Popover modal={false} open={open} onOpenChange={(val) => !disabled && setOpen(val)}>
        <div className="relative">
          <PopoverAnchor asChild>
            <div
              className={cn("relative cursor-pointer", disabled && "cursor-not-allowed")}
              onClick={openMenu}
            >
              <TitleCaseInput
                value={value}
                disabled={disabled}
                placeholder="--:--"
                onChange={(e) => onChange(formatTimeInput(e.target.value))}
                onBlur={() => onChange(normalizeTimeOnBlur(value))}
                onFocus={openMenu}
                className={cn(
                  "h-10 pr-8 text-[11px] font-normal rounded-[6px] text-[#344054] bg-white w-full",
                  disabled && "bg-[#F2F4F7] cursor-not-allowed pointer-events-none !opacity-100",
                  isLeave && "border-yellow-400",
                  isApportioned && "border-[#6C5DD3]"
                )}
              />
              <Clock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-70 pointer-events-none text-gray-500" />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="p-0 w-auto"
            align="start"
            side="top"
            sideOffset={5}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
            }}
          >
            <TimePickerDropdown value={value} onChange={(v) => { onChange(v); setOpen(false); }} minuteStep={15} />
          </PopoverContent>
        </div>
      </Popover>
    </div>
  )
}

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
    <div className={cn("min-w-[90px] flex-1 space-y-0.5 relative")}>
      <Label className="text-[11px] text-muted-foreground">Supporting doc</Label>
      <input ref={fileRef} type="file" className="hidden" multiple onChange={(e) => { if (e.target.files?.length) { onAdd(parentId, e.target.files); e.target.value = ""; } }} />
      <div className={cn(
        "flex h-10 w-full items-center rounded-[6px] border border-input text-[11px] overflow-hidden bg-white",
        disabled && "bg-[#F2F4F7] cursor-not-allowed",
        isLeave && "border-yellow-400",
        isApportioned && "border-[#6C5DD3]"
      )}>
        <button type="button" className={cn("flex flex-1 min-w-0 items-center px-2 overflow-hidden", disabled && "cursor-not-allowed")} onClick={() => setOpen((v) => !v)}>
          <span className="truncate text-foreground flex-1">{pillLabel}</span>
          {extraCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-[6px] bg-[#6C5DD3]/10 text-[#6C5DD3] text-[10px] font-bold shrink-0">
              +{extraCount}
            </span>
          )}
          <ChevronDown className={cn("size-3 ml-1 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {!disabled && (
          <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={cn("shrink-0 w-10 border-l border-input h-full text-[#6C5DD3] hover:bg-accent flex items-center justify-center", uploading && "opacity-40 cursor-not-allowed")}>
            <Plus className="size-5" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[220px] rounded-md border border-border bg-white shadow-lg py-1">
          {docs.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-muted-foreground italic">
              No documents uploaded
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc.name} className="flex items-center gap-2 px-3 py-1.5">
                <span className="flex-1 truncate text-[11px] text-foreground">{doc.name}</span>
                <button type="button" className="shrink-0 text-[#6C5DD3] hover:opacity-70 cursor-pointer" onClick={() => { onDownload(parentId, doc); setOpen(false); }}>
                  <Eye className="size-3.5" />
                </button>
                {!disabled && (
                  <button type="button" className="shrink-0 text-destructive hover:opacity-70 cursor-pointer" onClick={() => { onDelete(parentId, doc.name); if (docs.length <= 1) setOpen(false); }}>
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

const parentFieldRowClass = "flex flex-row items-end gap-2 flex-nowrap"

export function PersonalTimeStudyEntryForm({
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
}: PersonalTimeStudyEntryFormProps) {
  const { user } = useAuth()
  const userId = propsUserId || user?.id || ""
  const username = propsUsername || user?.name || ""

  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [parents, setParents] = useState<TimeEntryParentRow[]>([createParent()])
  const [prevInitialRecords, setPrevInitialRecords] = useState<any[] | undefined>(undefined)
  const [prevLeaveRecords, setPrevLeaveRecords] = useState<any[] | undefined>(undefined)

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

  // Multicode cache: use lifted state from parent if provided (survives date remounts), else local
  const [localDepartmentMulticodes, setLocalDepartmentMulticodes] = useState<Record<string, any[]>>({})
  const [localFetchingDepartments, setLocalFetchingDepartments] = useState<Record<string, boolean>>({})
  const localFetchedMulticodesRef = useRef<Set<string>>(new Set())

  // Snapshot of server-loaded parents — used to detect changes and build changed-only payload.
  // Only rows that came from the server (have a dbId) are stored here.
  // Leave rows, apportioning rows, and brand-new rows (no dbId) are never in the snapshot.
  const parentsSnapshotRef = useRef<TimeEntryParentRow[]>([])

  const departmentMulticodes = propDepartmentMulticodes ?? localDepartmentMulticodes
  const fetchingDepartments = propFetchingDepartments ?? localFetchingDepartments

  // Derive multicodeBundles from the per-dept cache (no separate API call needed)
  const multicodeBundles = useMemo(() => {
    if (!allowMulticodeUi) return []
    const allRaw = Object.values(departmentMulticodes).flat()
    if (!allRaw.length) return []
    return normalizeMulticodeDropdownPayload(allRaw, dropdownData)
  }, [allowMulticodeUi, departmentMulticodes, dropdownData])

  /** Department for a program id — multicode bundle first when multi-code UI is enabled, then main dropdown. */
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
    // Try resolving dept from dropdown data first; fall back to the saved departmentId on the row
    const deptId = resolveDepartmentIdForProgram(parent.tsProgram) ?? parent.departmentId
    const departments = apportioningConfig?.departments
    const deptConfig = departments?.find((d: any) => Number(d.departmentId) === Number(deptId))
    // If deptId resolved → use that dept (or first as fallback).
    // If deptId is still unknown AND user has exactly 1 dept → auto-apply it.
    // If deptId is unknown AND multiple depts → safe defaults (can't know which).
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
    // If parent is managing the cache, delegate to it
    if (onFetchMulticodeDept) {
      return onFetchMulticodeDept(deptIdStr)
    }
    // Local fallback
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

  const fetchActivitiesForProgram = useCallback(async (programIdStr: string | undefined) => {
    const programId = programIdStr?.trim()
    if (!programId || !userId) return
    const deptId = resolveDepartmentIdForProgram(programId)
    if (!deptId) return


    const key = `${deptId}:${programId}`
    if (fetchedRef.current.has(key)) return
    fetchedRef.current.add(key)
    try {
      const res = await apiGetUserActivitiesForProgram(userId, deptId, programId)
      setProgramActivities(prev => ({
        ...prev,
        [key]: res || []
      }))
    } catch (err) {
      fetchedRef.current.delete(key)
      console.error(`Failed to fetch activities for program ${programId} in dept ${deptId}`, err)
    }
  }, [userId, resolveDepartmentIdForProgram, allowMulticodeUi, fetchMulticodeProgramsForDepartment])

  const isFetchingActivitiesForProgram = useCallback(
    (programId: string | undefined) => {
      const normalized = String(programId ?? "").trim()
      if (!normalized) return false
      const deptId = resolveDepartmentIdForProgram(normalized)
      if (!deptId) return false
      const key = `${deptId}:${normalized}`
      return !programActivities[key] && fetchedRef.current.has(key)
    },
    [programActivities, resolveDepartmentIdForProgram],
  )

  // moveSaveSubmitToTop: computed live from the programs the user has actually selected.
  // Buttons move to top only when ALL non-leave, non-apportioning rows with a selected
  // program belong to departments that require the button at top.
  // If the user has exactly 1 department assigned, we auto-apply its setting initially.
  const moveSaveSubmitToTop = useMemo(() => {
    const departments = apportioningConfig?.departments
    if (departments?.length === 1) {
      return departments[0].requiresSaveAndSubmitButtonMoveToTop === true
    }
    const activeParents = parents.filter(p => !p.isLeave && !p.apportioning && !!p.tsProgram)
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

  if (initialRecords !== prevInitialRecords || leaveRecords !== prevLeaveRecords) {
    setPrevInitialRecords(initialRecords)
    setPrevLeaveRecords(leaveRecords)
    const syncRecordsToState = () => {
      const filtered = (initialRecords ?? []).filter((r) => {
        if (r.date?.split("T")[0] !== dateStr) {
          return false
        }
        if (r.apportioning === true) {
          return false
        }
        if (r.leaveid) {
          const leave = leaveRecords?.find((l) => Number(l.id) === Number(r.leaveid))
          const lStatus = leave?.status?.toLowerCase();
          if (leave && lStatus !== "approved" && lStatus !== "draft" && lStatus !== "requested") {
            return false
          }
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
          }
          parentMap.set(rec.id, parentRow)
        }
      })
      const sorted = Array.from(parentMap.values()).sort((a, b) => {
        if (!a.start) return 1
        if (!b.start) return -1
        return b.start.localeCompare(a.start)
      })

      const leaveRows: TimeEntryParentRow[] = []
      if (leaveRecords) {
        leaveRecords.forEach((leave) => {
          const lStatus = leave.status?.toLowerCase();
          if (lStatus === "approved" || lStatus === "draft" || lStatus === "requested") {
            const lStart = (leave.starttime ?? "").split(":").slice(0, 2).join(":")
            const lEnd = (leave.endtime ?? "").split(":").slice(0, 2).join(":")
            const existing = sorted.find(
              (rec) =>

                leave.id !== undefined &&
                rec.leaveid !== undefined &&
                Number(rec.leaveid) === Number(leave.id),
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
                description: "",
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
                // totalMin: String(leave.leaveTotalTime ?? ""),
                leaveid: leave.id,
                tsProgram: String(leave.programid ?? ""),
                serviceActivity: String(leave.activityid ?? ""),
                description: "",
                supportingDocLabel: "",
                supportingDocs: [],
                subRows: subRows,
                programCode: leave.programcode,
                programName: leave.programname,
                activityCode: leave.activitycode,
                activityName: leave.activityname,
                isLeave: true,
              })
            }
          }
        })
      }

      const combined = [...sorted, ...leaveRows]
      const final = combined.length > 0 ? combined : [createParent()]
      // Freeze snapshot of server-loaded rows so handleSave can detect what changed.
      // Only rows with a dbId (came from the server) are snapshotted.
      parentsSnapshotRef.current = final.filter(p => !!p.dbId && !p.isLeave && !p.apportioning && !p.leaveid)
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
      const list = bundles.flatMap((d: any) =>
        (d.programs ?? []).map((p: any) => ({ ...p, departmentCode: d.departmentCode })),
      )
      const unique = Array.from(new Map(list.map((p: any) => [p.id, p])).values())
      return mapToOpts(unique)
    }
    const fallbackList = programs.filter((p: any) => p.isMultiCode)
    const filteredFallback = parentDeptId
      ? fallbackList.filter((p: any) => Number(p.departmentId) === Number(parentDeptId))
      : fallbackList
    return mapToOpts(filteredFallback)
  }, [allowMulticodeUi, departmentMulticodes, dropdownData, programs, resolveDepartmentIdForProgram])

  // Activities are already user-filtered by the /user/programs-activities endpoint.
  // No per-program API call needed — use the already-loaded activities directly.

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

        // Auto-fill logic
        if (patch.start !== undefined && !rowSettings.removeAutoFillEndTime) {
          updatedP.end = addMinutesToTime(patch.start, 15)
        }

        if (patch.start !== undefined || patch.end !== undefined) {
          if (!rowSettings.hideTime && !assertEndAfterStartOrToast(updatedP.start, updatedP.end, `time-val-${id}`)) {
            return p
          }
          updatedP.isEdited = true
          updatedP.totalMin = String(computeDurationMinutes(updatedP.start, updatedP.end))
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
            if (
              !rowSettings.hideTime &&
              !assertEndAfterStartOrToast(updated.start, updated.end, `sub-time-val-${subRowId}`)
            ) {
              return s
            }
            updated.totalMin = String(computeDurationMinutes(updated.start, updated.end))
          } else if (updates.totalMin !== undefined) {
            // If totalMin is updated manually, try to move end time
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
            return p // Reject change
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
    if (p?.dbId) {
      onDelete?.(p.dbId)
    }

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
    if (!deptId || !userMultiCode.some(item => Number(item.departmentId) === Number(deptId))) {
      return
    }

    if (deptId) {
      fetchMulticodeProgramsForDepartment(deptId)
    }
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      return {
        ...p,
        subRows: [...p.subRows, createSubRow()]
      }
    }))
  }, [parents, resolveDepartmentIdForProgram, fetchMulticodeProgramsForDepartment, apportioningConfig?.userMultiCode])

  const removeSubRow = useCallback((parentId: string, subId: string) => {
    const parent = parents.find((p) => p.id === parentId);
    if (parent) {
      const sub = parent.subRows.find((s) => s.id === subId);
      if (sub?.dbId) {
        onDelete?.(sub.dbId);
      }
    }
    setParents((prev) => prev.map((p) => (p.id === parentId ? { ...p, subRows: p.subRows.filter((s) => s.id !== subId) } : p)));
  }, [parents, onDelete])

  const canDeleteParent = (parentId: string) => {
    if (isLocked) return false
    const parent = parents.find((p) => p.id === parentId)
    if (parent?.isLeave || parent?.leaveid || parent?.apportioning) return false
    return parents.length > 1 || !!parent?.dbId
  }

  /**
   * Returns true when a parent row's editable fields differ from its server snapshot.
   * Supporting doc pending uploads (file instanceof File) are also treated as a change.
   * Sub-rows (multicode children) are compared field-by-field.
   */
  const isParentChanged = (current: TimeEntryParentRow, snapshot: TimeEntryParentRow | undefined): boolean => {
    if (!snapshot) return true // no matching snapshot → treat as changed
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

  /**
   * @param overrideStatus  - Force a specific status on all records (e.g. "draft", "submitted").
   * @param changedOnly     - When true, only include rows that are new (no dbId) or differ from
   *                          the server snapshot. Leave/apportioning rows are always excluded.
   */
  const mapToPayload = (overrideStatus?: string, changedOnly = false): any[] => {
    const deptId = dropdownData?.[0]?.departmentId
    return parents
      .filter((p) => !p.isLeave && !p.leaveid && !p.apportioning)
      .filter((p) => {
        if (!changedOnly) return true
        if (!p.dbId) return true // brand-new row → always send
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
      if (p.isLeave || p.leaveid || p.apportioning) continue
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
        if (!assertEndAfterStartOrToast(p.start, p.end)) {
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
          if (
            !hideTime &&
            (s.start?.trim() || s.end?.trim()) &&
            !assertEndAfterStartOrToast(s.start, s.end)
          ) {
            return false
          }
          subTotalMin += Number(s.totalMin) || 0
        }

        if (subTotalMin > parentMin) {
          toast.error(`Total sub-row minutes (${subTotalMin}) cannot exceed parent minutes (${parentMin})`)
          return false
        }
      }

      // ── Leave-overlap check (additive) ──────────────────────────────
      // Skip overlap check for rows that were auto-generated from a leave (leaveid set) — they ARE the leave.
      if (!p.isLeave && !p.leaveid && leaveRecords && leaveRecords.length > 0) {
        const BLOCKING_STATUSES = ["draft", "requested", "approved"]
        const parseT = (t: string): number | null => {
          if (!t) return null
          // Handle both "HH:MM" and "HH:MM:SS"
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
            // Ranges overlap when: entryStart < leaveEnd AND leaveStart < entryEnd
            if (entryStart < leaveEnd && leaveStart < entryEnd) {
              const fmt = (mins: number) =>
                `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`
              toast.error(
                `Time entry (${fmt(entryStart)}–${fmt(entryEnd)}) overlaps with a ${status.charAt(0).toUpperCase() + status.slice(1)
                } leave request (${fmt(leaveStart)}–${fmt(leaveEnd)}). Please adjust the entry time.`
              )
              return false
            }
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────
    }
    return true
  }

  const handleSave = () => {
    if (!validateEntries()) return

    // Guard: only relevant when there are server-loaded records in the snapshot.
    // If the day has no saved records yet (fresh entry), skip the guard entirely.
    const hasServerRecords = parentsSnapshotRef.current.length > 0
    if (hasServerRecords) {
      const editableParents = parents.filter(p => !p.isLeave && !p.leaveid && !p.apportioning)
      const hasChanges = editableParents.some(p => {
        if (!p.dbId) return true // new row → always counts as a change
        const snap = parentsSnapshotRef.current.find(s => s.dbId === p.dbId)
        return isParentChanged(p, snap)
      })
      if (!hasChanges) {
        toast.warning("No changes to save", {
          position: "top-center",
          className:
            "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !text-[#111827] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        })
        return
      }
    }

    // changedOnly=true when server records exist → only send new/changed rows.
    // changedOnly=false for a fresh day → send everything (all rows are new).
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
  }

  const handleAddDocs = (parentId: string, files: FileList) => {
    const fileArray = Array.from(files)
    const parentRow = parents.find((p) => p.id === parentId)

    const newDocs = fileArray.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
      file: f
    }))

    updateParent(parentId, {
      supportingDocs: [...(parentRow?.supportingDocs ?? []), ...newDocs]
    })
  }

  const handleDeleteDoc = (parentId: string, name: string) => {
    setParents((prev) => prev.map((p) => {
      if (p.id !== parentId) return p
      const removed = p.supportingDocs.find((d) => d.name === name)
      if (removed) {
        // Revoke local blob URL only for unsaved files
        if (removed.file) URL.revokeObjectURL(removed.url)
        // If this is a saved doc on the server, delete it via API
        const parent = p
        if (!removed.file && removed.docId) {
          const parentDbId = parent.dbId
          if (parentDbId) {
            apiDeleteSupportingDoc(parentDbId, removed.docId).catch(() => { })
          }
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

  return (
    <section className={cn("relative w-full rounded-[6px] border-0 bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]", className)}>
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-[6px]">
          <Spinner className="text-[#6C5DD3]" />
        </div>
      )}
      <div className="mb-6 flex flex-col gap-2">
        {showLeaveBanner && leaveRecords && leaveRecords.filter(l => ["approved", "draft", "requested"].includes(l.status?.toLowerCase() ?? "")).map((leave, idx) => {
          const statusLabel = leaveBannerStatusLabel(leave.status)
          return (
          <div key={idx} className="mt-5 mb-1 mx-auto max-w-max rounded-[6px] bg-[#E2E8F0]/50 px-4 py-1.5 text-[13px] text-gray-600 italic text-center border border-[#CBD5E1]">
            {leave.name || leave.employeeName || username} applied leave in this date : <span className="not-italic font-medium text-gray-800">({dateStr})</span> from : <span className="not-italic font-medium text-gray-800">({leave.starttime})</span> To : <span className="not-italic font-medium text-gray-800">({leave.endtime})</span>
            {statusLabel ? <span className="whitespace-pre">{statusLabel}</span> : null}.
          </div>
          )
        })}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] text-[#6C5DD3] font-semibold">Time Entries</h3>
          </div>

          {!hideSummaryHeader && (
            <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 text-[14px] flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Allocated TS Minutes:</span>
                <span className="font-semibold text-[#6C5DD3]">{allocatedTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">Entered TS Minutes:</span>
                <span className="font-semibold text-[#6C5DD3]">{actualTotal || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700">TS Balance:</span>
                <span className="font-semibold text-[#6C5DD3]">{balanceTotal || 0}</span>
              </div>
              {actualMultiTotal !== null && actualMultiTotal !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700">Entered MAA Minutes:</span>
                  <span className="font-semibold text-[#6C5DD3]">{actualMultiTotal || 0}</span>
                </div>
              )}
              {multiBalanceTotal !== null && multiBalanceTotal !== undefined && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-700">MAA Balance:</span>
                  <span className="font-semibold text-[#6C5DD3]">{multiBalanceTotal || 0}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            {apportioningConfig?.supervisorApportioning && !hideApportioningInfo && (
              <div className="flex items-center gap-2 bg-[#F8F9FA] border border-[#E2E8F0] px-3 py-1.5 rounded-[6px] h-9">
                <div className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-[#6C5DD3] bg-[#6C5DD3] text-white opacity-50 cursor-not-allowed">
                  <Check className="size-3 stroke-[3]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label
                    className="text-[12px] text-[#344054] font-semibold cursor-not-allowed select-none"
                  >
                    Apportioning
                  </Label>
                  {apportioningSummary && apportioningSummary.length > 0 && (
                    <HoverCard openDelay={0} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        <div className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors flex items-center shrink-0">
                          <AlertCircle className="size-3.5" />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-fit min-w-[340px] max-w-sm p-3 z-[100] bg-white border border-gray-100 shadow-xl rounded-[8px] text-[#111827]"
                        align="end"
                        side="top"
                      >
                        <div className="text-[11px] font-medium space-y-2">
                          {apportioningSummary.map((item) => (
                            <div key={item.departmentId} className="border-b last:border-b-0 pb-2 last:pb-0 border-gray-100">
                              <div className="font-bold text-[#6C5DD3] text-[12px] flex items-center justify-between gap-2">
                                <span className="flex-1">{item.departmentName}</span>
                                {item.apportioningType && item.apportioningType !== "none" && (
                                  <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-mono shrink-0">
                                    {item.apportioningType}
                                  </span>
                                )}
                              </div>
                              {item.outOfDateRange ? (
                                <p
                                  className="mt-1.5 mb-1 text-[12px] text-gray-700 font-medium leading-snug w-full"
                                  dangerouslySetInnerHTML={{ __html: `<b>Note:</b> ${item.message}` }}
                                />
                              ) : (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[#344054]">
                                  {item.startDate && (
                                    <div>
                                      <span className="text-muted-foreground font-medium">Start Date:</span>{" "}
                                      <span className="font-semibold text-foreground">{item.startDate}</span>
                                    </div>
                                  )}
                                  {item.endDate && (
                                    <div>
                                      <span className="text-muted-foreground font-medium">End Date:</span>{" "}
                                      <span className="font-semibold text-foreground">{item.endDate}</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground font-medium">Percent:</span>{" "}
                                    <span className="font-semibold text-foreground">{item.apportioningPercent}%</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground font-medium">Allocated:</span>{" "}
                                    <span className="font-semibold text-foreground">{item.allocatedMinutes} Min.</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground font-medium">Supervisor Consumed:</span>{" "}
                                    <span className="font-semibold text-[#6C5DD3]">{item.supervisorConsumedMinutes ?? 0} Min.</span>
                                  </div>
                                  {item.apportioningType !== "manual" && (
                                    <div>
                                      <span className="text-muted-foreground font-medium">Reportee Minutes:</span>{" "}
                                      <span className="font-semibold text-[#6C5DD3]">{item.enteredMinutes} Min.</span>
                                    </div>
                                  )}
                                  <div>
                                    <span className="text-muted-foreground font-medium">Remaining:</span>{" "}
                                    <span className="font-semibold text-[#6C5DD3]">{item.remainingMinutes} Min.</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              </div>
            )}
            {!readonly && moveSaveSubmitToTop && (
              <div className="flex items-center gap-2 mr-2">
                <Button
                  disabled={isLocked || allIsLeave}
                  className={cn("h-9 px-4 bg-[#6C5DD3] hover:bg-[#5B4DBF] text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")}
                  onClick={handleSave}
                >
                  Save
                </Button>
                <Button
                  disabled={isLocked || allIsLeave}
                  className={cn("h-9 px-4 bg-green-600 hover:bg-green-700 text-white text-[12px]", (isLocked || allIsLeave) && "cursor-not-allowed")}
                  onClick={() => setShowSubmitConfirm(true)}
                >
                  Submit
                </Button>
              </div>
            )}
            {!readonly && (
              <div className="flex items-center gap-2 shrink-0">
                {apportioningConfig?.allowUserEntry === false && (
                  hideApportioningInfo ? (
                    onOpenPeriodsSheet && (
                      <button
                        type="button"
                        onClick={onOpenPeriodsSheet}
                        className="h-9 flex items-center gap-3.5 rounded-[8px] bg-white text-[#6C5DD3] border border-gray-200 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors shrink-0 px-3 py-1.5"
                        title="Clicked to view Time Study Period and Apportioning"
                      >
                        <span className="text-[11px] font-semibold text-gray-500 select-none">
                          Note: Click on the warning icon to view why the time entry is blocked
                        </span>
                        <AlertTriangle className="size-6 text-[#F97316] animate-pulse shrink-0" />
                      </button>
                    )
                  ) : null
                )}
                <Button
                  size="icon"
                  disabled={isLocked}
                  className={cn("size-9 bg-[#6C5DD3] hover:bg-[#6C5DD3]/90", isLocked && "cursor-not-allowed")}
                  onClick={addParentAtTop}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {parents.map((parent) => {
          const totalDisplay = computeDurationMinutes(parent.start, parent.end)
          const isLeaveRow = parent.isLeave
          const isApportionedRow = parent.apportioning === true
          const rowSettings = getRowSettings(parent)
          const effectiveHideTime = resolveEffectiveHideTime(parent)
          const hideDocs = rowSettings.hideSupportingDoc
          const hideNotes = rowSettings.hideDescriptionActivityNote

          return (
            <div key={parent.id} className={cn("rounded-md", !isLeaveRow && !isApportionedRow && "bg-card/50 p-2 border border-border/50")}>
              <div className={cn(parentFieldRowClass, (isLeaveRow || isApportionedRow) && "p-2")}>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-[11px] text-[#6C5DD3] font-medium">TS Program <RequiredMark /></Label>
                  <SingleSelectSearchDropdown
                    value={parent.tsProgram}
                    placeholder="Select program"
                    disabled={isLocked || isLeaveRow || isApportionedRow}
                    title={(!apportioningConfig?.timestudyAllowedDepartmentIds || apportioningConfig.timestudyAllowedDepartmentIds.length === 0) && !apportioningConfig?.bypassSchedule ? "No Time Study period Allocated" : undefined}
                    isLoading={isDropdownLoading}
                    onOpenChange={(open) => {
                      if (open) onOpenDropdown?.()
                    }}
                    options={(() => {
                      const filtered = programs
                        .filter((p: any) => !p.isMultiCode)
                        .map((p: any) => {
                          const deptPrefix = (p.departmentCode ?? '').split('-')[0]
                          return { value: String(p.id), label: `${deptPrefix}-${p.code} - ${p.name}` }
                        });

                      if (parent.tsProgram && !filtered.some((o) => o.value === parent.tsProgram)) {
                        if (parent.programCode || parent.programName) {
                          const deptPrefix = (parent.departmentCode ?? '').split('-')[0];
                          const prefix = deptPrefix ? `${deptPrefix}-` : '';
                          filtered.unshift({ value: parent.tsProgram, label: `${prefix}${parent.programCode ?? ''} - ${parent.programName ?? ''}` });
                        }
                      }
                      return filtered;
                    })()}
                    onChange={(v) => {
                      if (v !== parent.tsProgram) {
                        updateParent(parent.id, { tsProgram: v, serviceActivity: '' });
                      } else {
                        updateParent(parent.id, { tsProgram: v });
                      }
                      fetchActivitiesForProgram(v);
                      checkAndRefetchConfig(v);
                    }}
                    onBlur={() => { }}
                    className={cn("h-10 text-[11px]", (isLocked || isLeaveRow || isApportionedRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                  />
                </div>
                <div className="flex-1 space-y-0.5">
                  <Label className="text-[11px] text-[#6C5DD3] font-medium">Service / Activity Code <RequiredMark /></Label>
                  <SingleSelectSearchDropdown
                    value={parent.serviceActivity}
                    placeholder="Select Activity Code"
                    disabled={isLocked || isLeaveRow || isApportionedRow || !parent.tsProgram}
                    isLoading={isFetchingActivitiesForProgram(parent.tsProgram)}
                    onOpenChange={(open) => {
                      if (open && parent.tsProgram) {
                        fetchActivitiesForProgram(parent.tsProgram);
                      }
                    }}
                    options={(() => {
                      if (!parent.tsProgram) return [];
                      const deptId = resolveDepartmentIdForProgram(parent.tsProgram);
                      const key = deptId ? `${deptId}:${parent.tsProgram}` : "";
                      const listForProg = key ? (programActivities[key] ?? []) : [];
                      const filtered = listForProg
                        .map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }));
                      if (parent.serviceActivity && !filtered.some((o) => o.value === parent.serviceActivity)) {
                        const fallback = listForProg.find((a: any) => String(a.id) === parent.serviceActivity) as any;
                        if (fallback) {
                          filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` });
                        } else if (parent.activityCode || parent.activityName) {
                          filtered.unshift({ value: parent.serviceActivity, label: `${parent.activityCode ?? ''} - ${parent.activityName ?? ''}` });
                        }
                      }
                      return filtered;
                    })()}
                    onChange={(v) => updateParent(parent.id, { serviceActivity: v })}
                    onBlur={() => { }}
                    className={cn("h-10 text-[11px]", (isLocked || isLeaveRow || isApportionedRow || !parent.tsProgram) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                  />
                </div>
                {!effectiveHideTime && (
                  <TimePicker24h label="Start" value={parent.start} disabled={isLocked || isLeaveRow || isApportionedRow} isLeave={isLeaveRow} isApportioned={isApportionedRow} onChange={(v) => updateParent(parent.id, { start: v })} />
                )}
                {!effectiveHideTime && (
                  <TimePicker24h label="End" value={parent.end} disabled={isLocked || isLeaveRow || isApportionedRow || !parent.start} isLeave={isLeaveRow} isApportioned={isApportionedRow} onChange={(v) => updateParent(parent.id, { end: v })} />
                )}
                {effectiveHideTime ? (
                  <MinDecimalField
                    label={
                      <>
                        Hrs. <RequiredMark />
                      </>
                    }
                    labelClassName="text-[11px] text-muted-foreground"
                    value={parent.totalMin ?? ""}
                    readOnly={isLocked || isLeaveRow || isApportionedRow}
                    showDecimalHint
                    hintMessage={parent.activityTimeMessage}
                    inputClassName={cn(
                      isLeaveRow && "border-yellow-400",
                      isApportionedRow && "border-[#6C5DD3]",
                    )}
                    onChange={(v) => updateParent(parent.id, { totalMin: v })}
                  />
                ) : (
                  <div className="w-[60px] space-y-0.5">
                    <Label className="text-[11px] text-muted-foreground">Min. <RequiredMark /></Label>
                    <TitleCaseInput
                      type="number"
                      min="0"
                      readOnly={isLocked || isLeaveRow || isApportionedRow}
                      value={parent.dbId && !parent.isEdited ? (parent.totalMin || "") : ((!totalDisplay || totalDisplay === "0") ? (parent.totalMin || totalDisplay || "") : totalDisplay)}
                      placeholder="—"
                      className={cn(
                        "h-10 text-[11px] bg-[#F2F4F7] cursor-not-allowed",
                        isLeaveRow && "border-yellow-400",
                        isApportionedRow && "border-[#6C5DD3]",
                      )}
                    />
                  </div>
                )}
                {!hideNotes && (
                  <div className="flex-[1.5] space-y-0.5">
                    <Label className="text-[11px] text-muted-foreground">Description</Label>
                    <TitleCaseInput
                      value={parent.description}
                      readOnly={isLocked || isLeaveRow || isApportionedRow}
                      onChange={(e) => updateParent(parent.id, { description: e.target.value })}
                      placeholder="Add description here..."
                      className={cn("h-10 text-[11px] text-[#344054] font-normal", (isLocked || isLeaveRow || isApportionedRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                    />
                  </div>
                )}
                {!hideDocs && (
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
                )}
                <div className="flex items-end gap-1 pb-0.5">
                  {!readonly && canDeleteParent(parent.id) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={isLocked}
                      className={cn("size-10 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")}
                      onClick={() => removeParent(parent.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                  {!readonly && !isLeaveRow && !isApportionedRow && isMulticodeAllowedForParent(parent) && (
                    <Button
                      size="icon"
                      variant="outline"
                      disabled={isLocked}
                      className={cn("size-10 border-green-600 text-green-600 hover:bg-green-600/10", isLocked && "cursor-not-allowed")}
                      onClick={() => addSubRow(parent.id)}
                      aria-label="Add multi-code row"
                    >
                      <Plus className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              {parent.subRows.length > 0 && (
                <div className="mt-4 space-y-3 border-l-2 border-[#6C5DD3]/20 pl-4 ml-8">
                  {parent.subRows.map((sub) => (
                    <div key={sub.id} className={parentFieldRowClass}>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Program <RequiredMark /></Label>
                        <SingleSelectSearchDropdown
                          value={sub.studyProgram}
                          placeholder="Select program"
                          disabled={isLocked || isLeaveRow || isApportionedRow}
                          title={(!apportioningConfig?.timestudyAllowedDepartmentIds || apportioningConfig.timestudyAllowedDepartmentIds.length === 0) && !apportioningConfig?.bypassSchedule ? "No Time Study period Allocated" : undefined}
                          isLoading={(() => {
                            const deptId = resolveDepartmentIdForProgram(parent.tsProgram)
                            return Boolean(deptId && fetchingDepartments[String(deptId)])
                          })()}
                          onOpenChange={(open) => {
                            if (open) {
                              onOpenDropdown?.()
                              const deptId = resolveDepartmentIdForProgram(parent.tsProgram)
                              if (deptId) {
                                fetchMulticodeProgramsForDepartment(deptId)
                              }
                            }
                          }}
                          options={(() => {
                            const filtered = [...getSubRowProgramOptions(parent.tsProgram)]
                            if (sub.studyProgram && !filtered.some((o) => o.value === sub.studyProgram)) {
                              if (sub.programCode || sub.programName) {
                                const deptPrefix = (sub.departmentCode ?? "").split("-")[0]
                                const prefix = deptPrefix ? `${deptPrefix}-` : ""
                                filtered.unshift({
                                  value: sub.studyProgram,
                                  label: `${prefix}${sub.programCode ?? ""} - ${sub.programName ?? ""}`,
                                })
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
                      <div className="flex-1 space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Activity Code <RequiredMark /></Label>
                        <SingleSelectSearchDropdown
                          value={sub.serviceActivity}
                          placeholder="Select Activity Code"
                          disabled={isLocked || isLeaveRow || isApportionedRow || !sub.studyProgram}
                          isLoading={isFetchingActivitiesForProgram(sub.studyProgram)}
                          onOpenChange={(open) => {
                            if (open && sub.studyProgram) {
                              fetchActivitiesForProgram(sub.studyProgram)
                            }
                          }}
                          options={(() => {
                            if (!sub.studyProgram) return []
                            const deptId = resolveDepartmentIdForProgram(sub.studyProgram)
                            const key = deptId ? `${deptId}:${sub.studyProgram}` : ""
                            const listForProg = key ? (programActivities[key] ?? []) : []
                            const filtered = listForProg
                              .map((a: any) => ({ value: String(a.id), label: `${a.code} - ${a.name}` }))
                            if (sub.serviceActivity && !filtered.some((o) => o.value === sub.serviceActivity)) {
                              const fallback = listForProg.find((a: any) => String(a.id) === sub.serviceActivity) as any
                              if (fallback) {
                                filtered.unshift({ value: String(fallback.id), label: `${fallback.code} - ${fallback.name}` })
                              } else if (sub.activityCode || sub.activityName) {
                                filtered.unshift({
                                  value: sub.serviceActivity,
                                  label: `${sub.activityCode ?? ""} - ${sub.activityName ?? ""}`,
                                })
                              }
                            }
                            return filtered
                          })()}
                          onChange={(v) => updateSubRow(parent.id, sub.id, { serviceActivity: v })}
                          onBlur={() => { }}
                          className={cn("h-9 text-[11px]", (isLocked || isLeaveRow || isApportionedRow || !sub.studyProgram) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                        />
                      </div>
                      <MinDecimalField
                        label={
                          <>
                            {(effectiveHideTime || !!sub.activityTimeMessage) ? "Hrs." : "Min."}{" "}
                            <RequiredMark />
                          </>
                        }
                        labelClassName="text-[11px] text-[#6C5DD3] font-medium"
                        value={sub.totalMin}
                        readOnly={isLocked || isLeaveRow || isApportionedRow}
                        showDecimalHint={effectiveHideTime || !!sub.activityTimeMessage}
                        hintMessage={sub.activityTimeMessage}
                        heightClass="h-9"
                        inputClassName={cn(
                          isLeaveRow && "border-yellow-400",
                          isApportionedRow && "border-[#6C5DD3]",
                        )}
                        onChange={(v) => updateSubRow(parent.id, sub.id, { totalMin: v })}
                      />
                      {(() => {
                        const hideSubNotes = getRowSettings(parent).hideDescriptionActivityNote
                        if (hideSubNotes) return null
                        return (
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Label className="text-[11px] text-muted-foreground whitespace-nowrap">
                                Description
                              </Label>
                            </div>
                            <TitleCaseInput
                              value={sub.description}
                              readOnly={isLocked || isLeaveRow || isApportionedRow}
                              onChange={(e) => updateSubRow(parent.id, sub.id, { description: e.target.value })}
                              placeholder="Add description here..."
                              className={cn("h-9 text-[11px] text-[#344054] font-normal", (isLocked || isLeaveRow || isApportionedRow) && "bg-[#F2F4F7] cursor-not-allowed", isLeaveRow && "border-yellow-400", isApportionedRow && "border-[#6C5DD3]")}
                            />
                          </div>
                        )
                      })()}
                      <div className="flex items-end pb-0.5">
                        {!readonly && !isLeaveRow && !isApportionedRow && (
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isLocked}
                            className={cn("size-9 text-destructive hover:bg-destructive/10", isLocked && "cursor-not-allowed")}
                            onClick={() => removeSubRow(parent.id, sub.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <PersonalTimeStudyApportioningPanel
        apportioningConfig={apportioningConfig}
        supervisorOwnMinutesToday={actualTotal || 0}
        apportioningRecords={apportioningRecords}
        autoApportioning={apportioningConfig?.autoApportioning}
      />

      {!readonly && !moveSaveSubmitToTop && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            disabled={isLocked || allIsLeave}
            className={cn("h-10 px-8 bg-[#6C5DD3] hover:bg-[#5B4DBF]", (isLocked || allIsLeave) && "cursor-not-allowed")}
            onClick={handleSave}
          >
            Save
          </Button>
          <Button
            disabled={isLocked || allIsLeave}
            className={cn("h-10 px-8 bg-green-600 hover:bg-green-700 text-white", (isLocked || allIsLeave) && "cursor-not-allowed")}
            onClick={() => setShowSubmitConfirm(true)}
          >
            Submit
          </Button>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-[520px] rounded-[12px] bg-white p-6 shadow-2xl">
            <h3 className="mb-6 text-[16px] font-medium text-center">Are you sure, you want to lock the time and fully submit it?</h3>
            <div className="flex justify-center gap-4">
              <Button variant="outline" className="h-11 min-w-[100px] bg-[#F2F4F7]" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
              <Button className="h-11 min-w-[100px] bg-[#6C5DD3] text-white" onClick={() => { setShowSubmitConfirm(false); handleSubmitInternal(); }}>OK</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

