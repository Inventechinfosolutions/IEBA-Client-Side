import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"

import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { TimePickerDropdown } from "@/components/ui/time-picker"
import { Clock } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { cn } from "@/lib/utils"


import {
  EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE,
  employeeLeaveRequestFormSchema,
  type EmployeeLeaveRequestFormValues,
} from "../schema/PersonalTimeStudySchema"
import {
  coerceProgramsActivitiesBundles,
  findProgramDepartmentInBundles,
  inferDepartmentIdForProgramSelection,
  mergeDropdownDataForLeaveLookups,
  normalizeMulticodeDropdownPayload,
  pickDepartmentIdFromEntity,
} from "../utils/multicodeDropdownUtils"

import { partitionLeaveEntryIndexGroups, apiGetUserActivitiesForProgram, apiGetUserProgramsAndActivitiesMulticode } from "../api/personalTimeStudyApi"

const EMPTY = EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE

function RequiredMark() {
  return <span className="text-destructive">*</span>
}

const leaveChildFieldRowClass = "flex flex-row items-end gap-2 flex-nowrap"



function createEmptyRow(): EmployeeLeaveRequestFormValues["entries"][number] {
  return {
    date: "",
    startTime: "",
    endTime: "",
    programCode: EMPTY,
    activityCode: EMPTY,
    totalMinApplied: "",
    comment: "",
    multicodeChild: false,
  }
}

function createMulticodeChildRow(
  anchor: EmployeeLeaveRequestFormValues["entries"][number],
): EmployeeLeaveRequestFormValues["entries"][number] {
  return {
    date: anchor.date ?? "",
    startTime: anchor.startTime ?? "",
    endTime: anchor.endTime ?? "",
    programCode: EMPTY,
    activityCode: EMPTY,
    totalMinApplied: "",
    comment: "",
    multicodeChild: true,
  }
}

export type EmployeeLeaveRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Persist draft — optional; second arg is merged dropdown for API name resolution when multicode is used. */
  onSave?: (values: EmployeeLeaveRequestFormValues, lookupDropdown?: any[]) => void | Promise<void>
  /** Final submit — optional */
  onSubmit?: (values: EmployeeLeaveRequestFormValues, lookupDropdown?: any[]) => void | Promise<void>
  initialValues?: EmployeeLeaveRequestFormValues
  className?: string
  dropdownData?: any[]
  title?: string
  editingStatus?: string | null
  isSaving?: boolean
  isSubmitting?: boolean
  isDropdownLoading?: boolean
  onDropdownOpen?: () => void
  isFetching?: boolean
  editingLeave?: any
  /** Logged-in user (multicode + activity queries). */
  userId?: string
  /** From user profile GET /users/:id/details `allowMultiCodes`. */
  allowMultiCodes?: boolean
}

const getHeaderGridClass = (isEditing: boolean, allowMulticodeUi: boolean, showTime: boolean) =>
  cn(
    "grid min-w-[950px] items-end gap-2.5 text-[14px] font-normal text-[#4A4A4A] whitespace-nowrap",
    showTime
      ? (isEditing && !allowMulticodeUi
          ? "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(5rem,0.8fr)_minmax(5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)]"
          : "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(5rem,0.8fr)_minmax(5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)_7.5rem]")
      : (isEditing && !allowMulticodeUi
          ? "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)]"
          : "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)_7.5rem]")
  )

const getRowGridClass = (isEditing: boolean, allowMulticodeUi: boolean, showTime: boolean) =>
  cn(
    "grid min-w-[950px] items-end gap-2.5 py-2",
    showTime
      ? (isEditing && !allowMulticodeUi
          ? "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(5rem,0.8fr)_minmax(5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)]"
          : "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(5rem,0.8fr)_minmax(5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)_7.5rem]")
      : (isEditing && !allowMulticodeUi
          ? "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)]"
          : "grid-cols-[minmax(7.5rem,1fr)_minmax(8.5rem,1.3fr)_minmax(8.5rem,1.3fr)_minmax(6.5rem,0.8fr)_minmax(8.5rem,1.1fr)_7.5rem]")
  )

function TimePicker24h({
  value,
  onChange,
  className,
  disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)

  const openMenu = () => {
    if (!disabled) setOpen(true)
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full shrink-0", className)}>
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
                onChange={(e) => onChange(e.target.value)}
                onFocus={openMenu}
                className={cn(
                  "h-10 pr-8 text-sm font-normal rounded-[6px] cursor-pointer w-full",
                  disabled && "cursor-not-allowed bg-muted !text-foreground pointer-events-none !opacity-100"
                )}
              />
              <Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
            </div>
          </PopoverAnchor>
          <PopoverContent
            className="p-0"
            align="start"
            side="bottom"
            avoidCollisions={true}
            collisionPadding={8}
            sideOffset={4}
            onOpenAutoFocus={(e) => {
              e.preventDefault()
              const container = e.currentTarget as HTMLElement
              setTimeout(() => {
                container
                  .querySelectorAll('[data-selected="true"]')
                  .forEach((el) => el.scrollIntoView({ block: "start", behavior: "auto" }))
              }, 50)
            }}
          >
            <TimePickerDropdown value={value} onChange={onChange} onClose={() => setOpen(false)} />
          </PopoverContent>
        </div>
      </Popover>
    </div>
  )
}

function calculateMinutesDiff(start: string, end: string): number {
  if (!start || !end) return 0
  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0
  let diff = (endH * 60 + endM) - (startH * 60 + startM)
  if (diff < 0) diff += 24 * 60 // handle overnight crossing
  return diff
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

export function EmployeeLeaveRequestDialog({
  open,
  onOpenChange,
  onSave,
  onSubmit,
  className,
  dropdownData,
  initialValues,
  title,
  editingStatus,
  isSaving = false,
  isSubmitting = false,
  isDropdownLoading = false,
  onDropdownOpen,
  isFetching = false,
  editingLeave,
  userId: propsUserId,
  allowMultiCodes,
}: EmployeeLeaveRequestDialogProps) {

  const { user } = useAuth()
  const effectiveUserId = (propsUserId ?? user?.id ?? "").trim()
  const allowMulticodeUi = allowMultiCodes === true

  const [dateConfigs, setDateConfigs] = useState<
    Record<
      string,
      {
        userMultiCode: Array<{ departmentId: number }>
        timestudyAllowed: Array<{ departmentId: number }>
        bypassSchedule: boolean
        departments: any[]
      }
    >
  >({})

  const fetchConfigForDate = useCallback(async (dateStr: string | undefined, showToastOnEmpty?: boolean) => {
    const date = dateStr?.split("T")[0]
    if (!date || !effectiveUserId) return

    try {
      const res = await api.get<any>(`/timestudyrecords/user/config?userId=${encodeURIComponent(effectiveUserId)}&date=${date}`)
      if (res?.success && res.data) {
        const timestudyAllowedRaw: Array<{ departmentId?: number; allowed?: boolean }> = res.data.timestudyAllowed ?? []
        const bypassSchedule = false
        const timestudyAllowed = timestudyAllowedRaw
          .filter((item): item is { departmentId: number; allowed?: boolean } => typeof item.departmentId === "number" && item.allowed === true)
          .map((item) => ({ departmentId: item.departmentId }))

        setDateConfigs(prev => ({
          ...prev,
          [date]: {
            userMultiCode: res.data.userMultiCode ?? [],
            timestudyAllowed,
            bypassSchedule,
            departments: res.data.departments ?? [],
          }
        }))
        if (showToastOnEmpty && timestudyAllowed.length === 0 && !bypassSchedule) {
          toast.error("No Time Study Period Allocated")
        }
      }
    } catch (err) {
      console.error(`Failed to fetch user config for date ${date}`, err)
    }
  }, [effectiveUserId])

  const isEditing = !!initialValues;
  const isApproved = editingStatus?.toLowerCase() === "approved";

  const dropdownBundles = useMemo(() => coerceProgramsActivitiesBundles(dropdownData), [dropdownData])

  const programs = useMemo(() => {
    const list =
      dropdownBundles.flatMap((d: any) =>
        (d.programs ?? []).map((p: any) => ({
          ...p,
          departmentCode: d.departmentCode,
          departmentId: p.departmentId ?? p.department?.id ?? d.departmentId ?? d.department?.id,
        })),
      ) ?? []
    const unique = Array.from(new Map(list.map((p: any) => [p.id, p])).values())
    return unique
  }, [dropdownBundles])



  const form = useForm<EmployeeLeaveRequestFormValues>({
    resolver: zodResolver(employeeLeaveRequestFormSchema),
    defaultValues: initialValues || {
      entries: [createEmptyRow()],
    },
  })

  const [prevInitialValues, setPrevInitialValues] = useState(initialValues)
  if (initialValues !== prevInitialValues) {
    setPrevInitialValues(initialValues)
    if (initialValues) {
      form.reset(initialValues)
      const dates = initialValues.entries
        ?.map(e => e.date?.split("T")[0])
        .filter((d): d is string => !!d)
      if (dates) {
        const uniqueDates = [...new Set(dates)]
        for (const date of uniqueDates) {
          fetchConfigForDate(date)
        }
      }
    }
  }

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const formEntries = form.watch("entries")

  const leaveEntryIndexGroups = useMemo(
    () => partitionLeaveEntryIndexGroups(formEntries ?? []),
    [formEntries],
  )




  const [departmentMulticodes, setDepartmentMulticodes] = useState<Record<string, any[]>>({})
  const [fetchingDepartments, setFetchingDepartments] = useState<Record<string, boolean>>({})
  const [programActivities, setProgramActivities] = useState<Record<string, any[]>>({})
  const fetchedRef = useRef<Set<string>>(new Set())
  const fetchMulticodeProgramsForDepartment = useCallback(async (deptIdStr: string | number | undefined) => {
    const deptId = String(deptIdStr || '').trim()
    if (!deptId || !effectiveUserId) return
    setFetchingDepartments(prev => ({ ...prev, [deptId]: true }))
    try {
      const res = await apiGetUserProgramsAndActivitiesMulticode(effectiveUserId, deptId)
      setDepartmentMulticodes(prev => ({
        ...prev,
        [deptId]: res || []
      }))
    } catch (err) {
      console.error(`Failed to fetch multicode programs for department ${deptId}`, err)
    } finally {
      setFetchingDepartments(prev => ({ ...prev, [deptId]: false }))
    }
  }, [effectiveUserId])
  const multicodeBundles = useMemo(() => {
    const allFetched = Object.values(departmentMulticodes).flat()
    return normalizeMulticodeDropdownPayload(allFetched, dropdownBundles)
  }, [departmentMulticodes, dropdownBundles])

  const mergedLookupDropdown = useMemo(() => {
    const allFetched = Object.values(departmentMulticodes).flat()
    const merged = mergeDropdownDataForLeaveLookups(dropdownBundles, allFetched)
    if (!merged) return merged

    // Merge dynamically fetched activities from programActivities into the respective department bundles
    for (const key of Object.keys(programActivities)) {
      const [deptId] = key.split(":")
      if (!deptId) continue
      const activitiesList = programActivities[key] ?? []
      const bundle = merged.find((b: any) => Number(b.departmentId) === Number(deptId))
      if (bundle) {
        if (!bundle.activities) bundle.activities = []
        const existingIds = new Set(bundle.activities.map((a: any) => String(a.id)))
        for (const act of activitiesList) {
          if (!existingIds.has(String(act.id))) {
            bundle.activities.push(act)
            existingIds.add(String(act.id))
          }
        }
      }
    }
    return merged
  }, [dropdownBundles, departmentMulticodes, programActivities])

  /** Main / merged bundles first so primary leave rows match PTS `departmentId`+`programId` pairs; multicode last. */
  const resolveDepartmentIdForProgram = useCallback(
    (programIdStr: string | undefined): number | undefined => {
      const trimmed = programIdStr?.trim()
      if (!trimmed) return undefined

      let d =
        findProgramDepartmentInBundles(dropdownBundles.length ? dropdownBundles : undefined, trimmed) ??
        findProgramDepartmentInBundles(mergedLookupDropdown ?? undefined, trimmed)
      if (d != null) return d

      const flatProgram = programs.find((p: any) => String(p.id) === trimmed)
      const fromFlat = pickDepartmentIdFromEntity(flatProgram)
      if (fromFlat != null) return fromFlat

      if (allowMulticodeUi && multicodeBundles.length) {
        d = findProgramDepartmentInBundles(multicodeBundles, trimmed)
        if (d != null) return d
      }

      const inferred =
        inferDepartmentIdForProgramSelection(trimmed, dropdownBundles.length ? dropdownBundles : undefined) ??
        inferDepartmentIdForProgramSelection(trimmed, mergedLookupDropdown ?? undefined) ??
        (allowMulticodeUi && multicodeBundles.length
          ? inferDepartmentIdForProgramSelection(trimmed, multicodeBundles)
          : undefined)
      if (inferred != null) return inferred

      const roleDepts = (user?.departmentRoles ?? [])
        .map((dr) => Number(dr.departmentId))
        .filter((n) => Number.isFinite(n) && n > 0)
      if (roleDepts.length === 1) return roleDepts[0]

      return undefined
    },
    [allowMulticodeUi, dropdownBundles, mergedLookupDropdown, multicodeBundles, programs, user?.departmentRoles],
  )

  const getRowSettings = useCallback((date: string | undefined, programCode: string | undefined) => {
    const defaultSettings = { hideTime: false, removeAutoFillEndTime: true }
    const dateKey = date?.split("T")[0]

    const departments: any[] | undefined = dateKey ? dateConfigs[dateKey]?.departments : undefined

    // Resolve the department for this program
    const deptId = programCode && programCode !== EMPTY
      ? resolveDepartmentIdForProgram(programCode)
      : undefined

    const deptConfig = deptId != null
      ? departments?.find((d: any) => Number(d.departmentId) === Number(deptId))
      : undefined

    // Mirror EntryForm logic:
    // - deptId resolved → use that dept config (or first dept as fallback)
    // - deptId unknown + exactly 1 dept → auto-apply that single dept
    // - deptId unknown + multiple depts → safe defaults (can't know which)
    const activeConfig = deptId != null
      ? (deptConfig ?? departments?.[0])
      : (departments?.length === 1 ? departments[0] : undefined)

    if (!activeConfig) return defaultSettings

    return {
      hideTime: activeConfig.requiresStartEndTime === false,
      removeAutoFillEndTime: activeConfig.removeAutoFillEndTime === true,
    }
  }, [dateConfigs, resolveDepartmentIdForProgram])

  const isMulticodeAllowedForLeaveParent = useCallback(
    (parentIndex: number) => {
      if (!allowMulticodeUi) return false
      const parentRow = formEntries?.[parentIndex]
      if (!parentRow) return false
      const dateStr = parentRow.date?.split("T")[0]
      if (!dateStr) return false
      const parentProgramId = parentRow.programCode
      if (!parentProgramId || parentProgramId === EMPTY) return false

      const deptId = resolveDepartmentIdForProgram(parentProgramId)
      if (!deptId) return false

      const userMultiCode = dateConfigs[dateStr]?.userMultiCode ?? []
      return userMultiCode.some(item => item.departmentId === deptId)
    },
    [allowMulticodeUi, formEntries, resolveDepartmentIdForProgram, dateConfigs]
  )

  const formatLeaveProgramOption = useCallback((p: any) => {
    const deptPrefix = (p.departmentCode ?? "").split("-")[0]
    const codeStr = String(p.code ?? "")
    const prefixed =
      deptPrefix && codeStr.toLowerCase().startsWith(`${deptPrefix.toLowerCase()}-`)
        ? codeStr
        : deptPrefix
          ? `${deptPrefix}-${codeStr}`
          : codeStr
    return { value: String(p.id), label: `${prefixed} - ${p.name}` }
  }, [])

  /** Primary rows: non–multi-code programs. Rows with `multicodeChild`: multicode program list filtered to parent's dept. */
  const getLeaveProgramOptions = useCallback(
    (rowIndex: number) => {
      const rowDate = formEntries?.[rowIndex]?.date?.split("T")[0]
      if (!rowDate) return []

      const config = dateConfigs[rowDate]
      if (!config) return []

      const isMulticodeRow = formEntries?.[rowIndex]?.multicodeChild === true
      if (allowMulticodeUi && isMulticodeRow) {
        // Find the parent row by walking back to the nearest non-multicode row
        let parentProgramId: string | undefined
        for (let i = rowIndex - 1; i >= 0; i--) {
          if (!formEntries?.[i]?.multicodeChild) {
            parentProgramId = formEntries?.[i]?.programCode
            break
          }
        }
        const parentDeptId = parentProgramId ? resolveDepartmentIdForProgram(parentProgramId) : undefined

        if (parentDeptId && departmentMulticodes[String(parentDeptId)]?.length) {
          // Use per-dept cache filtered to parent's department
          const rawMc = departmentMulticodes[String(parentDeptId)]
          const bundles = normalizeMulticodeDropdownPayload(rawMc, dropdownBundles)
          const list = bundles.flatMap((d: any) =>
            (d.programs ?? []).map((pr: any) => ({ ...pr, departmentCode: d.departmentCode })),
          )
          const unique = Array.from(new Map(list.map((pr: any) => [pr.id, pr])).values())
          if (unique.length) return unique.map(formatLeaveProgramOption)
        }

        if (multicodeBundles.length) {
          // Fallback: filter global multicode bundles by parent dept
          const list = multicodeBundles.flatMap((d: any) =>
            (d.programs ?? []).map((pr: any) => ({ ...pr, departmentCode: d.departmentCode })),
          )
          let filtered = list
          if (parentDeptId) {
            filtered = list.filter((pr: any) => {
              const prDept = pr.departmentId ?? pr.department?.id
              return prDept != null && Number(prDept) === Number(parentDeptId)
            })
          }
          const unique = Array.from(new Map(filtered.map((pr: any) => [pr.id, pr])).values())
          if (unique.length) return unique.map(formatLeaveProgramOption)
        }

        // Last fallback: filter programs array
        const fallback = programs.filter((p: any) => p.isMultiCode)
        const deptFiltered = parentDeptId
          ? fallback.filter((p: any) => Number(p.departmentId) === Number(parentDeptId))
          : fallback
        return deptFiltered.map(formatLeaveProgramOption)
      }
      const allowedDeptIds = config.timestudyAllowed.map((d) => d.departmentId)
      const filteredPrograms = config.bypassSchedule
        ? programs
        : programs.filter((p: any) => allowedDeptIds.includes(p.departmentId))
      return filteredPrograms.filter((p: any) => !p.isMultiCode).map(formatLeaveProgramOption)
    },
    [allowMulticodeUi, departmentMulticodes, dropdownBundles, formEntries, multicodeBundles, programs, formatLeaveProgramOption, resolveDepartmentIdForProgram, dateConfigs],
  )





  const multicodeProgramListLoading =
    allowMulticodeUi &&
    Object.values(fetchingDepartments).some(Boolean)

  const fetchActivitiesForProgram = useCallback(async (programIdStr: string | undefined) => {
    const programId = programIdStr?.trim()
    if (!programId || !effectiveUserId || programId === EMPTY) return
    const deptId = resolveDepartmentIdForProgram(programId)
    if (!deptId) return

    const key = `${deptId}:${programId}`
    if (fetchedRef.current.has(key)) return
    fetchedRef.current.add(key)
    try {
      const res = await apiGetUserActivitiesForProgram(effectiveUserId, deptId, programId)
      setProgramActivities(prev => ({
        ...prev,
        [key]: res || []
      }))
    } catch (err) {
      fetchedRef.current.delete(key)
      console.error(`Failed to fetch activities for program ${programId} in dept ${deptId}`, err)
    }
  }, [effectiveUserId, resolveDepartmentIdForProgram])

  const isFetchingActivitiesForProgram = useCallback(
    (programId: string | undefined) => {
      const normalized = String(programId ?? "").trim()
      if (!normalized || normalized === EMPTY) return false
      const deptId = resolveDepartmentIdForProgram(normalized)
      if (!deptId) return false
      const key = `${deptId}:${normalized}`
      return fetchedRef.current.has(key) && !programActivities[key]
    },
    [resolveDepartmentIdForProgram, programActivities],
  )

  const hasExceeded = useMemo(() => {
    return formEntries.some((entry, index) => {
      const currentTotal = Number(entry.totalMinApplied || 0)

      // 1. Check against physical time difference
      if (entry.startTime && entry.endTime) {
        const diff = calculateMinutesDiff(entry.startTime, entry.endTime)
        if (currentTotal > diff) return true
      }

      // 2. Check against original approved amount
      if (isApproved && initialValues?.entries) {
        const originalTotal = Number(initialValues.entries[index]?.totalMinApplied || 0)
        if (originalTotal > 0 && currentTotal > originalTotal) return true
      }

      return false
    })
  }, [formEntries, isApproved, initialValues])

  const resetForm = useCallback(() => {
    form.reset({ entries: [createEmptyRow()] })
  }, [form])

  const appendPrimaryLeaveRow = useCallback(() => {
    append(createEmptyRow())
  }, [append])

  const appendMulticodeChildRowForParent = useCallback(
    (parentAnchorIndex: number) => {
      if (!isMulticodeAllowedForLeaveParent(parentAnchorIndex)) return

      const entries = form.getValues("entries")
      const anchor = entries[parentAnchorIndex] ?? createEmptyRow()
      let insertAt = parentAnchorIndex + 1
      while (insertAt < entries.length && entries[insertAt]?.multicodeChild === true) {
        insertAt++
      }
      insert(insertAt, createMulticodeChildRow(anchor))
    },
    [form, insert, isMulticodeAllowedForLeaveParent],
  )

  const removeLeaveGroup = useCallback(
    (parentIndex: number) => {
      const entries = form.getValues("entries")
      let count = 1
      let j = parentIndex + 1
      while (j < entries.length && entries[j]?.multicodeChild === true) {
        count++
        j++
      }
      for (let k = 0; k < count; k++) {
        remove(parentIndex)
      }
    },
    [form, remove],
  )

  const updateDuration = useCallback((index: number, newStart: string, newEnd: string) => {
    if (newStart && newEnd) {
      const diff = calculateMinutesDiff(newStart, newEnd)
      if (diff > 0) {
        form.setValue(`entries.${index}.totalMinApplied`, String(diff), {
          shouldValidate: true,
          shouldDirty: true,
        })
      }
    }
  }, [form])

  /** Copy this parent's date/times onto its consecutive multicode child rows. */
  const syncMulticodeChildRowsFromParent = useCallback(
    (parentRowIndex: number) => {
      const entries = form.getValues("entries")
      const anchor = entries[parentRowIndex]
      if (!anchor || anchor.multicodeChild) return
      let i = parentRowIndex + 1
      while (i < entries.length && entries[i]?.multicodeChild === true) {
        const row = entries[i]
        if (
          row.date === anchor.date &&
          row.startTime === anchor.startTime &&
          row.endTime === anchor.endTime
        ) {
          i++
          continue
        }
        form.setValue(`entries.${i}.date`, anchor.date, { shouldValidate: true, shouldDirty: true })
        form.setValue(`entries.${i}.startTime`, anchor.startTime, { shouldValidate: true, shouldDirty: true })
        form.setValue(`entries.${i}.endTime`, anchor.endTime, { shouldValidate: true, shouldDirty: true })
        i++
      }
    },
    [form],
  )

  const scheduleSyncMulticodeChildRowsFromParent = useCallback(
    (parentRowIndex: number) => {
      queueMicrotask(() => {
        syncMulticodeChildRowsFromParent(parentRowIndex)
      })
    },
    [syncMulticodeChildRowsFromParent],
  )

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) resetForm()
      onOpenChange(next)
    },
    [onOpenChange, resetForm]
  )

  const validateChildMinutes = () => {
    const entries = form.getValues("entries")
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.multicodeChild) continue

      const parentMin = Number(entry.totalMinApplied || 0)
      let childSum = 0
      let j = i + 1
      while (j < entries.length && entries[j]?.multicodeChild === true) {
        childSum += Number(entries[j].totalMinApplied || 0)
        j++
      }

      if (childSum > parentMin) {
        toast.error(`Total child minutes (${childSum}) cannot exceed parent minutes (${parentMin}).`)
        return false
      }
    }
    return true
  }

  const validateManualExceeds = () => {
    const entries = form.getValues("entries")
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const currentTotal = Number(entry.totalMinApplied || 0)

      if (entry.startTime && entry.endTime) {
        const diff = calculateMinutesDiff(entry.startTime, entry.endTime)
        if (currentTotal > diff) return true
      }

      if (isApproved && initialValues?.entries) {
        const originalTotal = Number(initialValues.entries[i]?.totalMinApplied || 0)
        if (originalTotal > 0 && currentTotal > originalTotal) return true
      }
    }
    return false
  }

  const validateRequiredTimes = () => {
    const entries = form.getValues("entries")
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (entry.multicodeChild) continue // Child rows inherit times/requirements from parent
      const settings = getRowSettings(entry.date, entry.programCode)
      if (!settings.hideTime) {
        if (!entry.startTime || !entry.endTime) {
          return false
        }
      }
    }
    return true
  }

  const handleSave = async () => {
    if (validateManualExceeds()) {
      toast.error("Total minutes cannot exceed the maximum allowed duration.")
      return
    }

    if (!validateRequiredTimes()) {
      toast.error("Start time and End time are required.")
      return
    }

    if (!validateChildMinutes()) {
      return
    }

    await form.handleSubmit(
      async (data) => {
        await onSave?.(data, mergedLookupDropdown ?? dropdownData)
        toast.success("Leave request saved")
        handleClose(false)
      },
      () => {
        const err =
          form.formState.errors.entries?.root?.message ||
          form.formState.errors.entries?.[0]?.date?.message ||
          "Please fix validation errors"
        toast.error(String(err))
      }
    )()
  }

  const handleSubmitFinal = async () => {
    if (validateManualExceeds()) {
      toast.error("Total minutes cannot exceed the maximum allowed duration.")
      return
    }

    if (!validateRequiredTimes()) {
      toast.error("Start time and End time are required.")
      return
    }

    if (!validateChildMinutes()) {
      return
    }

    await form.handleSubmit(
      async (data) => {
        await onSubmit?.(data, mergedLookupDropdown ?? dropdownData)
        toast.success("Leave request submitted")
        handleClose(false)
      },
      () => {
        const err =
          form.formState.errors.entries?.root?.message ||
          form.formState.errors.entries?.[0]?.date?.message ||
          "Please fix validation errors"
        toast.error(String(err))
      }
    )()
  }

  const showTimeColumns = useMemo(() => {
    return formEntries.some((entry) => {
      if (entry.multicodeChild) return false // Child rows inherit times/visibility from parent
      if (!entry.programCode || entry.programCode === EMPTY) {
        // No program selected — check the date's allowed departments config
        const dateKey = entry.date?.split("T")[0]
        if (!dateKey || !dateConfigs[dateKey]) return true // no config yet → show by default (safe)
        const depts: any[] = dateConfigs[dateKey].departments ?? []
        if (depts.length === 0) return true // no departments config → show by default (safe)
        // Only 1 dept → use its setting; multiple → return safe default (show time columns)
        if (depts.length === 1) {
          return depts[0].requiresStartEndTime !== false
        }
        return true
      }
      const settings = getRowSettings(entry.date, entry.programCode)
      return !settings.hideTime
    })
  }, [formEntries, getRowSettings, dateConfigs])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showClose
        overlayClassName="bg-black/55"
        className={cn(
          "flex max-h-[min(90vh,800px)] w-full max-w-[min(96vw,1200px)] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg bg-white",
          className
        )}
      >
        {(isFetching || isSaving || isSubmitting) && (
          <div className="absolute inset-0 z-60 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-center text-lg font-semibold">
            {title || "Employee Leave Request"}
          </DialogTitle>
          {isApproved && (
            <div className="mt-3 mx-auto flex w-fit items-center justify-center rounded-[6px] bg-[#E5E7EB] px-6 py-1.5 text-[13px] italic text-[#1F2937]">
              Note : You cannot exceed more than {initialValues?.entries?.[0]?.totalMinApplied || 0} minutes
            </div>
          )}
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-4 py-3 sm:px-6">
            {/* Column headers */}
            <div className={getHeaderGridClass(isEditing, allowMulticodeUi, showTimeColumns)}>
              <span>Date</span>
              <span>Program Code</span>
              <span>Activity Code</span>
              {showTimeColumns && <span>Start Time</span>}
              {showTimeColumns && <span>End Time</span>}
              <span>Total Min Applied</span>
              <span>Comments</span>
              {(!isEditing || allowMulticodeUi) && <span className="sr-only">Row actions</span>}
            </div>

            <div className="divide-y divide-border">
              {leaveEntryIndexGroups.map((indices, groupIdx) => {
                const parentIndex = indices[0]!
                const childIndices = indices.slice(1)
                const parentField = fields[parentIndex]
                const isLastGroup = groupIdx === leaveEntryIndexGroups.length - 1
                const canRemoveParent =
                  !isEditing && !(parentIndex === 0 && leaveEntryIndexGroups.length === 1)

                return (
                  <div key={parentField.id} className="py-3 first:pt-1">
                    <div className={getRowGridClass(isEditing, allowMulticodeUi, showTimeColumns)}>
                      {/* Date */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.date`}
                          render={({ field: f, fieldState }) => (
                            <>
                              <TitleCaseInput
                                type="date"
                                className="h-10 text-sm rounded-[6px]"
                                name={f.name}
                                value={f.value}
                                ref={f.ref}
                                onBlur={f.onBlur}
                                onChange={(e) => {
                                  f.onChange(e)
                                  if (e.target.value) {
                                    fetchConfigForDate(e.target.value)
                                  }
                                  scheduleSyncMulticodeChildRowsFromParent(parentIndex)
                                }}
                              />
                              {fieldState.error?.message && (
                                <p className="text-xs text-destructive">{fieldState.error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      {/* Program Code */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.programCode`}
                          render={({ field: f, fieldState }) => (
                            <>
                              <SingleSelectSearchDropdown
                                value={f.value === EMPTY ? "" : f.value}
                                isLoading={isDropdownLoading || multicodeProgramListLoading}
                                title={(() => {
                                  const dateStr = form.getValues(`entries.${parentIndex}.date`)
                                  if (!dateStr) return undefined
                                  const dateKey = dateStr.split("T")[0]
                                  const config = dateConfigs[dateKey]
                                  if (config && (!config.timestudyAllowed || config.timestudyAllowed.length === 0) && !config.bypassSchedule) {
                                    return "No Time Study Period Allocated"
                                  }
                                  return undefined
                                })()}
                                onOpenChange={(open) => {
                                  if (open) {
                                    const dateStr = form.getValues(`entries.${parentIndex}.date`)
                                    if (dateStr) {
                                      onDropdownOpen?.();
                                      const dateKey = dateStr.split("T")[0]
                                      const config = dateConfigs[dateKey]
                                      if (config && (!config.timestudyAllowed || config.timestudyAllowed.length === 0) && !config.bypassSchedule) {
                                        toast.error("No Time Study Period Allocated")
                                      }
                                      fetchConfigForDate(dateStr, !config)
                                    } else {
                                      toast.error("Please select a date.")
                                    }
                                  }
                                }}
                                options={(() => {
                                  const opts = [...getLeaveProgramOptions(parentIndex)]
                                  const currentVal = f.value === EMPTY ? "" : f.value
                                  if (
                                    currentVal &&
                                    !opts.some((o) => o.value === currentVal) &&
                                    editingLeave
                                  ) {
                                    if (String(editingLeave.programid) === currentVal) {
                                      const deptPrefix = (editingLeave.departmentcode ?? "").split("-")[0]
                                      opts.push({
                                        value: currentVal,
                                        label: deptPrefix
                                          ? `${deptPrefix}-${editingLeave.programcode} - ${editingLeave.programname}`
                                          : `${editingLeave.programcode} - ${editingLeave.programname}`,
                                      })
                                    }
                                  }
                                  return opts
                                })()}
                                placeholder="Select..."
                                onChange={(v) => {
                                  f.onChange(v || EMPTY)
                                  form.setValue(`entries.${parentIndex}.activityCode`, EMPTY, {
                                    shouldValidate: false,
                                  })
                                  if (v && v !== EMPTY) {
                                    fetchActivitiesForProgram(v)
                                  }
                                  const dateStr = form.getValues(`entries.${parentIndex}.date`)
                                  if (dateStr) {
                                    fetchConfigForDate(dateStr)
                                  }

                                  // Clear start/end times if newly selected program has hideTime === true
                                  const settings = getRowSettings(dateStr, v || EMPTY)
                                  if (settings.hideTime) {
                                    form.setValue(`entries.${parentIndex}.startTime`, "", { shouldValidate: true, shouldDirty: true })
                                    form.setValue(`entries.${parentIndex}.endTime`, "", { shouldValidate: true, shouldDirty: true })
                                  }

                                  // Clear all multicode child rows immediately following this parent
                                  let i = parentIndex + 1
                                  while (i < (formEntries?.length ?? 0) && formEntries?.[i]?.multicodeChild === true) {
                                    form.setValue(`entries.${i}.programCode`, EMPTY, { shouldValidate: false })
                                    form.setValue(`entries.${i}.activityCode`, EMPTY, { shouldValidate: false })
                                    i++
                                  }
                                }}
                                onBlur={f.onBlur}
                                className="h-10 min-h-0 rounded-[6px]"
                              />
                              {fieldState.error?.message && (
                                <p className="text-xs text-destructive">{fieldState.error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      {/* Activity Code */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.activityCode`}
                          render={({ field: f, fieldState }) => (
                            <>
                              {(() => {
                                const programIdRaw = formEntries?.[parentIndex]?.programCode
                                const programId = String(programIdRaw ?? "").trim()
                                const hasProgram = programId.length > 0 && programId !== EMPTY
                                const isActivityLoading = isFetchingActivitiesForProgram(
                                  !hasProgram ? undefined : programId,
                                )
                                const options = (() => {
                                  if (!hasProgram) return []
                                  const deptId = resolveDepartmentIdForProgram(programId)
                                  const key = deptId ? `${deptId}:${programId}` : ""
                                  const listForProg = key ? (programActivities[key] ?? []) : []
                                  const opts = listForProg.map((item: any) => {
                                    const id = String(item.id)
                                    const label = `${item.code} - ${item.name}`
                                    return { value: id, label }
                                  })
                                  const currentVal = f.value === EMPTY ? "" : f.value
                                  if (
                                    currentVal &&
                                    !opts.some((o) => o.value === currentVal) &&
                                    editingLeave
                                  ) {
                                    if (String(editingLeave.activityid) === currentVal) {
                                      opts.push({
                                        value: currentVal,
                                        label: `${editingLeave.activitycode} - ${editingLeave.activityname}`,
                                      })
                                    }
                                  }
                                  return opts
                                })()

                                return (
                                  <SingleSelectSearchDropdown
                                    value={f.value === EMPTY ? "" : f.value}
                                    placeholder="Select Activity Code"
                                    disabled={!hasProgram}
                                    isLoading={isActivityLoading}
                                    options={options}
                                    onChange={(v) => f.onChange(v || EMPTY)}
                                    onBlur={f.onBlur}
                                    className="h-9 min-h-0 text-[13px] bg-white border-border/60"
                                  />
                                )
                              })()}
                              {fieldState.error?.message && (
                                <p className="text-xs text-destructive">{fieldState.error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      {/* Start Time */}
                      {showTimeColumns && (
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.startTime`}
                          render={({ field: f, fieldState }) => {
                            const settings = getRowSettings(
                              form.getValues(`entries.${parentIndex}.date`),
                              form.getValues(`entries.${parentIndex}.programCode`)
                            )
                            const hideTime = settings.hideTime
                            const removeAutoFill = settings.removeAutoFillEndTime
                            if (hideTime) {
                              return (
                                <div className="flex h-10 items-center justify-center text-[#98A2B3] font-medium">
                                  —
                                </div>
                              )
                            }
                            return (
                              <div className="space-y-1">
                                <TimePicker24h
                                  value={f.value}
                                  disabled={isApproved}
                                  onChange={(v) => {
                                    f.onChange(v)
                                    if (!removeAutoFill) {
                                      // Auto-fill end time to start + 15 min
                                      const newEnd = addMinutesToTime(v, 15)
                                      form.setValue(`entries.${parentIndex}.endTime`, newEnd, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      })
                                      updateDuration(parentIndex, v, newEnd)
                                    } else {
                                      // No auto-fill — just recalculate duration with existing end
                                      const currentEnd = form.getValues(`entries.${parentIndex}.endTime`)
                                      updateDuration(parentIndex, v, currentEnd)
                                    }
                                    scheduleSyncMulticodeChildRowsFromParent(parentIndex)
                                  }}
                                  className="w-full"
                                />
                                {fieldState.error?.message && (
                                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                )}
                              </div>
                            )
                          }}
                        />
                      )}

                      {/* End Time */}
                      {showTimeColumns && (
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.endTime`}
                          render={({ field: f, fieldState }) => {
                            const settings = getRowSettings(
                              form.getValues(`entries.${parentIndex}.date`),
                              form.getValues(`entries.${parentIndex}.programCode`)
                            )
                            const hideTime = settings.hideTime
                            const removeAutoFill = settings.removeAutoFillEndTime
                            if (hideTime) {
                              return (
                                <div className="flex h-10 items-center justify-center text-[#98A2B3] font-medium">
                                  —
                                </div>
                              )
                            }
                            // removeAutoFill=false → auto-filled, field disabled
                            // removeAutoFill=true → user sets manually, field enabled
                            const endTimeDisabled = isApproved || !removeAutoFill
                            return (
                              <div className="space-y-1">
                                <TimePicker24h
                                  value={f.value}
                                  disabled={endTimeDisabled}
                                  onChange={(v) => {
                                    f.onChange(v)
                                    const currentStart = form.getValues(`entries.${parentIndex}.startTime`)
                                    updateDuration(parentIndex, currentStart, v)
                                    scheduleSyncMulticodeChildRowsFromParent(parentIndex)
                                  }}
                                  className="w-full"
                                />
                                {fieldState.error?.message && (
                                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                )}
                              </div>
                            )
                          }}
                        />
                      )}

                      {/* Total Min Applied */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.totalMinApplied`}
                          render={({ field: f, fieldState }) => {
                            const settings = getRowSettings(
                              form.getValues(`entries.${parentIndex}.date`),
                              form.getValues(`entries.${parentIndex}.programCode`)
                            )
                            const hideTime = settings.hideTime
                            const removeAutoFill = settings.removeAutoFillEndTime
                            // Editable when: time is hidden (user enters min directly)
                            // OR removeAutoFillEndTime=true (user manually sets all times)
                            const minAppliedEditable = hideTime || removeAutoFill

                            const originalTotal = Number(
                              initialValues?.entries?.[parentIndex]?.totalMinApplied || 0,
                            )
                            const currentTotal = Number(f.value || 0)
                            const exceedsOriginal =
                              isApproved && originalTotal > 0 && currentTotal > originalTotal
                            const startTime = formEntries?.[parentIndex]?.startTime
                            const endTime = formEntries?.[parentIndex]?.endTime
                            const diff =
                              startTime && endTime ? calculateMinutesDiff(startTime, endTime) : 0
                            const exceedsCalculated = !hideTime && diff > 0 && currentTotal > diff
                            const isErrorState = exceedsOriginal || exceedsCalculated

                            return (
                              <>
                                <TitleCaseInput
                                  type="text"
                                  inputMode="numeric"
                                  className={cn(
                                    "h-10 text-sm tabular-nums rounded-[6px]",
                                    (isApproved || !minAppliedEditable) &&
                                    "cursor-not-allowed bg-muted !opacity-100 !text-foreground",
                                    isErrorState &&
                                    "border-destructive text-destructive focus-visible:ring-destructive",
                                  )}
                                  disabled={isApproved}
                                  readOnly={!minAppliedEditable}
                                  placeholder="0"
                                  autoComplete="off"
                                  {...f}
                                  onChange={(e) => {
                                    if (minAppliedEditable) {
                                      const cleanVal = e.target.value.replace(/\D/g, "")
                                      f.onChange(cleanVal)
                                    }
                                  }}
                                />
                                {fieldState.error?.message ? (
                                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                ) : exceedsCalculated ? (
                                  <p className="text-[11px] text-destructive leading-tight">
                                    Max allowed is {diff} min
                                  </p>
                                ) : exceedsOriginal ? (
                                  <p className="text-[11px] text-destructive leading-tight">
                                    Exceeds {originalTotal} min
                                  </p>
                                ) : null}
                              </>
                            )
                          }}
                        />
                      </div>

                      {/* Comments */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.comment`}
                          render={({ field: f, fieldState }) => (
                            <>
                              <TitleCaseInput
                                className="h-10 text-sm rounded-[6px]"
                                placeholder="Comments"
                                {...f}
                              />
                              {fieldState.error?.message && (
                                <p className="text-xs text-destructive">{fieldState.error.message}</p>
                              )}
                            </>
                          )}
                        />
                      </div>

                      {(!isEditing || (allowMulticodeUi && !isApproved)) && (
                        <div className="flex items-end justify-center gap-1 pb-0.5">
                          {isMulticodeAllowedForLeaveParent(parentIndex) && !isApproved && (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-10 shrink-0 rounded-[6px] border-green-600 text-green-600 hover:bg-green-600/10 ml-3"
                              onClick={() => {
                                const parentProgramId = form.getValues(`entries.${parentIndex}.programCode`)
                                if (parentProgramId) {
                                  const deptId = resolveDepartmentIdForProgram(parentProgramId)
                                  if (deptId) fetchMulticodeProgramsForDepartment(deptId)
                                }
                                appendMulticodeChildRowForParent(parentIndex)
                              }}
                              aria-label="Add multi-code row for this time"
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                          {!isEditing && isLastGroup && (
                            <Button
                              type="button"
                              size="icon"
                              className="size-10 shrink-0 rounded-[6px] bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
                              onClick={() => appendPrimaryLeaveRow()}
                              aria-label="Add another leave period"
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                          {!isEditing && canRemoveParent && (
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="size-10 shrink-0 rounded-[6px]"
                              onClick={() => removeLeaveGroup(parentIndex)}
                              aria-label="Remove this leave period"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {childIndices.length > 0 && (
                      <div className="mt-3 space-y-3 border-l-2 border-[#6C5DD3]/20 pl-4 ml-6 sm:ml-8">
                        {childIndices.map((index) => (
                          <div key={fields[index]!.id}>
                            <div className="hidden" aria-hidden>
                              <Controller
                                control={form.control}
                                name={`entries.${index}.date`}
                                render={({ field: f }) => <input type="hidden" {...f} />}
                              />
                              <Controller
                                control={form.control}
                                name={`entries.${index}.startTime`}
                                render={({ field: f }) => <input type="hidden" {...f} />}
                              />
                              <Controller
                                control={form.control}
                                name={`entries.${index}.endTime`}
                                render={({ field: f }) => <input type="hidden" {...f} />}
                              />
                            </div>
                            <div className={leaveChildFieldRowClass}>
                              <div className="min-w-0 flex-1 space-y-1">
                                <Label className="text-[11px] text-muted-foreground">
                                  Program <RequiredMark />
                                </Label>
                                <Controller
                                  control={form.control}
                                  name={`entries.${index}.programCode`}
                                  render={({ field: f, fieldState }) => (
                                    <>
                                      <SingleSelectSearchDropdown
                                        value={f.value === EMPTY ? "" : f.value}
                                        isLoading={isDropdownLoading || multicodeProgramListLoading}
                                        title={(() => {
                                          const dateStr = form.getValues(`entries.${index}.date`)
                                          if (!dateStr) return undefined
                                          const dateKey = dateStr.split("T")[0]
                                          const config = dateConfigs[dateKey]
                                          if (config && (!config.timestudyAllowed || config.timestudyAllowed.length === 0) && !config.bypassSchedule) {
                                            return "No Time Study period Allocated"
                                          }
                                          return undefined
                                        })()}
                                        onOpenChange={(open) => {
                                          if (open) {
                                            const dateStr = form.getValues(`entries.${index}.date`)
                                            if (dateStr) {
                                              onDropdownOpen?.();
                                              const dateKey = dateStr.split("T")[0]
                                              const config = dateConfigs[dateKey]
                                              if (config && (!config.timestudyAllowed || config.timestudyAllowed.length === 0) && !config.bypassSchedule) {
                                                toast.error("No Time Study Period Allocated")
                                              }
                                              fetchConfigForDate(dateStr, !config)
                                            } else {
                                              toast.error("Please select a date.")
                                            }
                                          }
                                        }}
                                        options={(() => {
                                          const opts = [...getLeaveProgramOptions(index)]
                                          const currentVal = f.value === EMPTY ? "" : f.value
                                          if (
                                            currentVal &&
                                            !opts.some((o) => o.value === currentVal) &&
                                            editingLeave
                                          ) {
                                            const childMc = (editingLeave.multiCodeRecords ?? []).find(
                                              (c: any) => String(c.programid) === currentVal
                                            )
                                            if (childMc) {
                                              const deptPrefix = (childMc.departmentcode || "").split("-")[0]
                                              opts.push({
                                                value: currentVal,
                                                label: deptPrefix
                                                  ? `${deptPrefix}-${childMc.programcode} - ${childMc.programname}`
                                                  : `${childMc.programcode} - ${childMc.programname}`,
                                              })
                                            } else if (String(editingLeave.programid) === currentVal) {
                                              const deptPrefix = (editingLeave.departmentcode ?? "").split("-")[0]
                                              opts.push({
                                                value: currentVal,
                                                label: deptPrefix
                                                  ? `${deptPrefix}-${editingLeave.programcode} - ${editingLeave.programname}`
                                                  : `${editingLeave.programcode} - ${editingLeave.programname}`,
                                              })
                                            }
                                          }
                                          return opts
                                        })()}
                                        placeholder="Select program"
                                        onChange={(v) => {
                                          f.onChange(v || EMPTY)
                                          form.setValue(`entries.${index}.activityCode`, EMPTY, {
                                            shouldValidate: false,
                                          })
                                          if (v && v !== EMPTY) {
                                            fetchActivitiesForProgram(v)
                                          }
                                        }}
                                        onBlur={f.onBlur}
                                        className="h-9 min-h-0 text-[11px] rounded-[6px]"
                                      />
                                      {fieldState.error?.message && (
                                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <Label className="text-[11px] text-muted-foreground">
                                  Activity Code <RequiredMark />
                                </Label>
                                <Controller
                                  control={form.control}
                                  name={`entries.${index}.activityCode`}
                                  render={({ field: f, fieldState }) => (
                                    <>
                                      {(() => {
                                        const programIdRaw = formEntries?.[index]?.programCode
                                        const programId = String(programIdRaw ?? "").trim()
                                        const hasProgram = programId.length > 0 && programId !== EMPTY
                                        const isActivityLoading = isFetchingActivitiesForProgram(
                                          !hasProgram ? undefined : programId,
                                        )
                                        const options = (() => {
                                          if (!hasProgram) return []
                                          const deptId = resolveDepartmentIdForProgram(programId)
                                          const key = deptId ? `${deptId}:${programId}` : ""
                                          const listForProg = key ? (programActivities[key] ?? []) : []
                                          const opts = listForProg.map((item: any) => {
                                            const id = String(item.id)
                                            const label = `${item.code} - ${item.name}`
                                            return { value: id, label }
                                          })
                                          const currentVal = f.value === EMPTY ? "" : f.value
                                          if (
                                            currentVal &&
                                            !opts.some((o) => o.value === currentVal) &&
                                            editingLeave
                                          ) {
                                            const childMc = (editingLeave.multiCodeRecords ?? []).find(
                                              (c: any) => String(c.activityid) === currentVal
                                            )
                                            if (childMc) {
                                              opts.push({
                                                value: currentVal,
                                                label: `${childMc.activitycode} - ${childMc.activityname}`,
                                              })
                                            } else if (String(editingLeave.activityid) === currentVal) {
                                              opts.push({
                                                value: currentVal,
                                                label: `${editingLeave.activitycode} - ${editingLeave.activityname}`,
                                              })
                                            }
                                          }
                                          return opts
                                        })()

                                        return (
                                          <SingleSelectSearchDropdown
                                            value={f.value === EMPTY ? "" : f.value}
                                            placeholder="Select Activity Code"
                                            disabled={!hasProgram}
                                            isLoading={isActivityLoading}
                                            options={options}
                                            onChange={(v) => f.onChange(v || EMPTY)}
                                            onBlur={f.onBlur}
                                            className="h-9 min-h-0 text-[11px] bg-white border-border/60"
                                          />
                                        )
                                      })()}
                                      {fieldState.error?.message && (
                                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              <div className="w-[72px] shrink-0 space-y-1">
                                <Label className="text-[11px] font-medium text-[#6C5DD3]">
                                  Min. <RequiredMark />
                                </Label>
                                <Controller
                                  control={form.control}
                                  name={`entries.${index}.totalMinApplied`}
                                  render={({ field: f, fieldState }) => {
                                    const originalTotal = Number(
                                      initialValues?.entries?.[index]?.totalMinApplied || 0,
                                    )
                                    const currentTotal = Number(f.value || 0)
                                    const exceedsOriginal =
                                      isApproved && originalTotal > 0 && currentTotal > originalTotal
                                    const startTime = formEntries?.[index]?.startTime
                                    const endTime = formEntries?.[index]?.endTime
                                    const diff =
                                      startTime && endTime
                                        ? calculateMinutesDiff(startTime, endTime)
                                        : 0
                                    const exceedsCalculated = diff > 0 && currentTotal > diff
                                    // Find parent row to sum children
                                    let parentRowIndex = -1
                                    for (let k = index - 1; k >= 0; k--) {
                                      if (!formEntries[k]?.multicodeChild) {
                                        parentRowIndex = k
                                        break
                                      }
                                    }
                                    const parentMin = parentRowIndex !== -1 ? Number(formEntries[parentRowIndex].totalMinApplied || 0) : 0
                                    let childSum = 0
                                    if (parentRowIndex !== -1) {
                                      let j = parentRowIndex + 1
                                      while (j < formEntries.length && formEntries[j]?.multicodeChild === true) {
                                        childSum += Number(formEntries[j].totalMinApplied || 0)
                                        j++
                                      }
                                    }
                                    const sumExceedsParent = childSum > parentMin
                                    const isErrorState = exceedsOriginal || exceedsCalculated || sumExceedsParent

                                    return (
                                      <>
                                        <TitleCaseInput
                                          type="text"
                                          inputMode="numeric"
                                          className={cn(
                                            "h-9 text-[11px] tabular-nums rounded-[6px]",
                                            isApproved &&
                                            "cursor-not-allowed bg-muted !opacity-100 !text-foreground",
                                            isErrorState &&
                                            "border-destructive text-destructive focus-visible:ring-destructive",
                                          )}
                                          disabled={isApproved}
                                          placeholder="0"
                                          autoComplete="off"
                                          {...f}
                                          onChange={(e) => {
                                            const cleanVal = e.target.value.replace(/\D/g, "")
                                            f.onChange(cleanVal)
                                          }}
                                        />
                                        {fieldState.error?.message ? (
                                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                        ) : exceedsCalculated ? (
                                          <p className="text-[10px] text-destructive leading-tight">
                                            Max {diff} min
                                          </p>
                                        ) : exceedsOriginal ? (
                                          <p className="text-[10px] text-destructive leading-tight">
                                            Exceeds {originalTotal} min
                                          </p>
                                        ) : sumExceedsParent ? (
                                          <p className="text-[10px] text-destructive leading-tight">
                                            Exceeds parent
                                          </p>
                                        ) : null}
                                      </>
                                    )
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <Label className="text-[11px] text-muted-foreground">Comments</Label>
                                <Controller
                                  control={form.control}
                                  name={`entries.${index}.comment`}
                                  render={({ field: f, fieldState }) => (
                                    <>
                                      <TitleCaseInput
                                        className="h-9 text-[11px] rounded-[6px]"
                                        placeholder="Comments"
                                        {...f}
                                      />
                                      {fieldState.error?.message && (
                                        <p className="text-xs text-destructive">{fieldState.error.message}</p>
                                      )}
                                    </>
                                  )}
                                />
                              </div>
                              {!isApproved && (
                                <div className="flex shrink-0 items-end pb-0.5">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="size-9 shrink-0 text-destructive hover:bg-destructive/10"
                                    onClick={() => remove(index)}
                                    aria-label="Remove multi-code row"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
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
          </div>

          <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border px-6 py-4 sm:justify-end">
            {editingStatus?.toLowerCase() !== "requested" && editingStatus?.toLowerCase() !== "approved" && (
              <Button
                type="button"
                variant="default"
                disabled={form.formState.isSubmitting || isSaving || isSubmitting || hasExceeded}
                onClick={() => void handleSave()}
                className={cn(
                  "h-10 rounded-[6px] px-8 text-white transition-opacity",
                  (form.formState.isSubmitting || isSaving || isSubmitting || hasExceeded) ? "bg-[#6C5DD3] opacity-50 cursor-not-allowed pointer-events-none" : "bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
                )}
              >
                Save
                {isSaving && <Spinner className="ml-2 size-4 border-white" />}
              </Button>
            )}
            <Button
              type="button"
              disabled={form.formState.isSubmitting || isSaving || isSubmitting || hasExceeded}
              onClick={() => void handleSubmitFinal()}
              className={cn(
                "h-10 rounded-[6px] px-8 text-white transition-opacity",
                (form.formState.isSubmitting || isSaving || isSubmitting || hasExceeded) ? "bg-[#6C5DD3] opacity-50 cursor-not-allowed pointer-events-none" : "bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
              )}
            >
              Submit
              {isSubmitting && <Spinner className="ml-2 size-4 border-white" />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
              className="h-10 rounded-[6px] px-8"
            >
              Exit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
