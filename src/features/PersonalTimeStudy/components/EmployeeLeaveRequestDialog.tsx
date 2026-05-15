import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useGetProgramActivityRelations } from "../queries/getProgramActivityRelations"
import { useGetPersonalMulticodeDropdowns } from "../queries/getPersonalDropdowns"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

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
import { mergeProgramActivityRelationTransferItems } from "@/features/program/queries/programActivityRelation"
import { partitionLeaveEntryIndexGroups } from "../api/personalTimeStudyApi"

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

const getHeaderGridClass = (isEditing: boolean) =>
  cn(
    "grid min-w-[1020px] items-end gap-4 text-[14px] font-normal text-[#4A4A4A] whitespace-nowrap",
    isEditing
      ? "grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)]"
      : "grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)_2.5rem]"
  )

const getRowGridClass = (isEditing: boolean) =>
  cn(
    "grid min-w-[1020px] items-end gap-4 py-2",
    isEditing
      ? "grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)]"
      : "grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)_2.5rem]"
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

  const activities = useMemo(() => {
    const list = dropdownBundles.flatMap((d: any) => d.activities ?? []) ?? []
    const unique = Array.from(new Map(list.map((a: any) => [a.id, a])).values())
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

  /** True when a row has a program id that is not in the primary (non–multi-code) list — e.g. editing MAA leave. */
  const needsMulticodeData = useMemo(() => {
    if (!allowMulticodeUi || !formEntries?.length) return false
    const primaryIds = new Set(
      programs.filter((p: any) => !p.isMultiCode).map((p: any) => String(p.id)),
    )
    return formEntries.some((e) => {
      const id = e.programCode && e.programCode !== EMPTY ? String(e.programCode).trim() : ""
      if (!id) return false
      return !primaryIds.has(id)
    })
  }, [allowMulticodeUi, formEntries, programs])

  const hasMulticodeChildRow = useMemo(
    () => (formEntries ?? []).some((e) => e.multicodeChild === true),
    [formEntries],
  )

  const shouldFetchMulticode =
    open &&
    allowMulticodeUi &&
    Boolean(effectiveUserId) &&
    (needsMulticodeData || hasMulticodeChildRow)

  const multicodeDropdownQuery = useGetPersonalMulticodeDropdowns(effectiveUserId, shouldFetchMulticode)
  const multicodeBundles = useMemo(
    () => normalizeMulticodeDropdownPayload(multicodeDropdownQuery.data, dropdownBundles),
    [multicodeDropdownQuery.data, dropdownBundles],
  )
  const mergedLookupDropdown = useMemo(
    () => mergeDropdownDataForLeaveLookups(dropdownBundles, multicodeDropdownQuery.data),
    [dropdownBundles, multicodeDropdownQuery.data],
  )

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

  /** Primary rows: non–multi-code programs. Rows with `multicodeChild`: multicode program list (like PTS sub-rows). */
  const getLeaveProgramOptions = useCallback(
    (rowIndex: number) => {
      const isMulticodeRow = formEntries?.[rowIndex]?.multicodeChild === true
      if (allowMulticodeUi && isMulticodeRow) {
        if (multicodeBundles.length) {
          const list = multicodeBundles.flatMap((d: any) =>
            (d.programs ?? []).map((pr: any) => ({ ...pr, departmentCode: d.departmentCode })),
          )
          const unique = Array.from(new Map(list.map((pr: any) => [pr.id, pr])).values())
          if (unique.length) return unique.map(formatLeaveProgramOption)
        }
        return programs.filter((p: any) => p.isMultiCode).map(formatLeaveProgramOption)
      }
      return programs.filter((p: any) => !p.isMultiCode).map(formatLeaveProgramOption)
    },
    [allowMulticodeUi, formEntries, multicodeBundles, programs, formatLeaveProgramOption],
  )

  const leaveActivityCatalog = useMemo(() => {
    const fromMc = multicodeBundles.flatMap((d: any) =>
      (d.activities ?? []).map((a: any) => ({ ...a, departmentCode: d.departmentCode })),
    )
    const merged = [...fromMc, ...activities]
    return Array.from(new Map(merged.map((a: any) => [a.id, a])).values())
  }, [multicodeBundles, activities])

  const getLeaveActivityCatalogForRow = useCallback(
    (rowIndex: number) => {
      const isMulticodeRow = formEntries?.[rowIndex]?.multicodeChild === true
      const ready = multicodeBundles.length > 0
      if (!ready) return activities
      if (isMulticodeRow && allowMulticodeUi) return leaveActivityCatalog
      if (!isMulticodeRow && needsMulticodeData) return leaveActivityCatalog
      return activities
    },
    [activities, allowMulticodeUi, formEntries, leaveActivityCatalog, multicodeBundles.length, needsMulticodeData],
  )

  const multicodeProgramListLoading =
    allowMulticodeUi &&
    shouldFetchMulticode &&
    multicodeDropdownQuery.isFetching &&
    !multicodeBundles.some((b: any) => (b.programs ?? []).length > 0)

  /**
   * Only fetch assigned activities for programs selected on a leave row (dialog open).
   */
  const programQueries = useMemo(() => {
    const list: { departmentId: number; programId: string }[] = []
    const seen = new Set<string>()

    const pushPair = (programIdStr: string | undefined) => {
      if (!programIdStr || programIdStr === EMPTY) return
      const trimmed = programIdStr.trim()
      if (!trimmed) return
      const deptId = resolveDepartmentIdForProgram(trimmed)
      if (deptId == null) return
      const key = `${deptId}:${trimmed}`
      if (seen.has(key)) return
      seen.add(key)
      list.push({ departmentId: deptId, programId: trimmed })
    }

    for (const entry of formEntries ?? []) {
      pushPair(entry.programCode)
    }
    return list
  }, [formEntries, resolveDepartmentIdForProgram])

  const programActivityQueryResults = useGetProgramActivityRelations(programQueries, open)

  /** When structured activities parse to nothing (or query did not run), use same-dept bundle activities as PTS catalog. */
  const getBundleActivitiesFallbackForProgram = useCallback(
    (programIdStr: string | undefined): { id: string; name: string; code?: string }[] => {
      const trimmed = String(programIdStr ?? "").trim()
      if (!trimmed || trimmed === EMPTY) return []
      for (const d of dropdownBundles) {
        const hasProgram = (d.programs ?? []).some((p: any) => String(p.id) === trimmed)
        if (!hasProgram) continue
        const list = (d.activities ?? []) as { id?: unknown; name?: string; code?: string }[]
        return list
          .filter((a) => a.id != null && String(a.id).trim() !== "")
          .map((a) => ({
            id: String(a.id),
            name: String(a.name ?? ""),
            code: a.code != null ? String(a.code) : undefined,
          }))
      }
      return []
    },
    [dropdownBundles],
  )

  /** Same tree walk as program admin + PTS sub-rows: do not rely on `node.assigned` (often absent). */
  const getActivityTransferItemsForProgram = useCallback(
    (programId: string) => {
      const normalized = String(programId ?? "").trim()
      if (!normalized || normalized === EMPTY) return []
      const deptId = resolveDepartmentIdForProgram(normalized)
      const index = programQueries.findIndex(
        (pq) => String(pq.programId).trim() === normalized && pq.departmentId === deptId,
      )
      if (index === -1) return []
      const result = programActivityQueryResults[index]
      if (!result?.data) return []
      return mergeProgramActivityRelationTransferItems(result.data)
    },
    [resolveDepartmentIdForProgram, programQueries, programActivityQueryResults],
  )

  const isFetchingActivitiesForProgram = useCallback(
    (programId: string | undefined) => {
      const normalized = String(programId ?? "").trim()
      if (!normalized || normalized === EMPTY) return false
      const deptId = resolveDepartmentIdForProgram(normalized)
      const index = programQueries.findIndex(
        (pq) => String(pq.programId).trim() === normalized && pq.departmentId === deptId,
      )
      return index !== -1 && !!programActivityQueryResults[index]?.isFetching
    },
    [resolveDepartmentIdForProgram, programQueries, programActivityQueryResults],
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
      const entries = form.getValues("entries")
      const anchor = entries[parentAnchorIndex] ?? createEmptyRow()
      let insertAt = parentAnchorIndex + 1
      while (insertAt < entries.length && entries[insertAt]?.multicodeChild === true) {
        insertAt++
      }
      insert(insertAt, createMulticodeChildRow(anchor))
    },
    [form, insert],
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
        updateDuration(i, anchor.startTime, anchor.endTime)
        i++
      }
    },
    [form, updateDuration],
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

  const handleSave = async () => {
    if (validateManualExceeds()) {
      toast.error("Total minutes cannot exceed the maximum allowed duration.")
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
            <div className={getHeaderGridClass(isEditing)}>
              <span>Date</span>
              <span>Start Time</span>
              <span>End Time</span>
              <span>Program Code</span>
              <span>Activity Code</span>
              <span>Total Min Applied</span>
              <span>Comments</span>
              {!isEditing && <span className="sr-only">Row actions</span>}
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
                    <div className={getRowGridClass(isEditing)}>
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

                      {/* Start Time */}
                      <Controller
                        control={form.control}
                        name={`entries.${parentIndex}.startTime`}
                        render={({ field: f, fieldState }) => (
                          <div className="space-y-1">
                            <TimePicker24h
                              value={f.value}
                              disabled={isApproved}
                              onChange={(v) => {
                                f.onChange(v)
                                const newEnd = addMinutesToTime(v, 15)
                                form.setValue(`entries.${parentIndex}.endTime`, newEnd, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                                updateDuration(parentIndex, v, newEnd)
                                scheduleSyncMulticodeChildRowsFromParent(parentIndex)
                              }}
                              className="w-full"
                            />
                            {fieldState.error?.message && (
                              <p className="text-xs text-destructive">{fieldState.error.message}</p>
                            )}
                          </div>
                        )}
                      />

                      {/* End Time */}
                      <Controller
                        control={form.control}
                        name={`entries.${parentIndex}.endTime`}
                        render={({ field: f, fieldState }) => (
                          <div className="space-y-1">
                            <TimePicker24h
                              value={f.value}
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
                        )}
                      />

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
                                onOpenChange={(open) => {
                                  if (open) {
                                    onDropdownOpen?.();
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
                                const catalog = getLeaveActivityCatalogForRow(parentIndex)
                                const catalogById = new Map(
                                  catalog.map((a: any) => [String(a.id), a] as const),
                                )
                                const isActivityLoading = isFetchingActivitiesForProgram(
                                  !hasProgram ? undefined : programId,
                                )
                                const options = (() => {
                                  if (!hasProgram) return []
                                  let items = getActivityTransferItemsForProgram(programId)
                                  if (items.length === 0 && !isActivityLoading) {
                                    items = getBundleActivitiesFallbackForProgram(programId)
                                  }
                                  const opts = items.map((item) => {
                                    const id = String(item.id)
                                    const a = catalogById.get(id) as any
                                    const label = a
                                      ? `${a.code} - ${a.name}`
                                      : item.code
                                        ? `${item.code} - ${item.name}`
                                        : item.name || id
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

                      {/* Total Min Applied */}
                      <div className="space-y-1">
                        <Controller
                          control={form.control}
                          name={`entries.${parentIndex}.totalMinApplied`}
                          render={({ field: f, fieldState }) => {
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
                            const exceedsCalculated = diff > 0 && currentTotal > diff
                            const isErrorState = exceedsOriginal || exceedsCalculated

                            return (
                              <>
                                <TitleCaseInput
                                  type="text"
                                  inputMode="numeric"
                                  className={cn(
                                    "h-10 text-sm tabular-nums rounded-[6px]",
                                    isApproved &&
                                      "cursor-not-allowed bg-muted !opacity-100 !text-foreground",
                                    isErrorState &&
                                      "border-destructive text-destructive focus-visible:ring-destructive",
                                  )}
                                  disabled={isApproved}
                                  placeholder="0"
                                  autoComplete="off"
                                  {...f}
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

                      {!isEditing && (
                        <div className="flex items-end justify-center gap-1 pb-0.5">
                          {isLastGroup && (
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
                          {allowMulticodeUi && (
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="size-10 shrink-0 rounded-[6px] border-[#6C5DD3] text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                              onClick={() => appendMulticodeChildRowForParent(parentIndex)}
                              aria-label="Add multi-code row for this time"
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                          {canRemoveParent && (
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
                                        options={(() => {
                                          const opts = [...getLeaveProgramOptions(index)]
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
                                        placeholder="Select program"
                                        onChange={(v) => {
                                          f.onChange(v || EMPTY)
                                          form.setValue(`entries.${index}.activityCode`, EMPTY, {
                                            shouldValidate: false,
                                          })
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
                                        const catalog = getLeaveActivityCatalogForRow(index)
                                        const catalogById = new Map(
                                          catalog.map((a: any) => [String(a.id), a] as const),
                                        )
                                        const isActivityLoading = isFetchingActivitiesForProgram(
                                          !hasProgram ? undefined : programId,
                                        )
                                        const options = (() => {
                                          if (!hasProgram) return []
                                          let items = getActivityTransferItemsForProgram(programId)
                                          if (items.length === 0 && !isActivityLoading) {
                                            items = getBundleActivitiesFallbackForProgram(programId)
                                          }
                                          const opts = items.map((item) => {
                                            const id = String(item.id)
                                            const a = catalogById.get(id) as any
                                            const label = a
                                              ? `${a.code} - ${a.name}`
                                              : item.code
                                                ? `${item.code} - ${item.name}`
                                                : item.name || id
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
                                    const isErrorState = exceedsOriginal || exceedsCalculated

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
                              {!isEditing && (
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
