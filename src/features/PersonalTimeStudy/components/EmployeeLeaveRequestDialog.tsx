import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useGetProgramActivityRelations } from "../queries/getProgramActivityRelations"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { SingleSelectSearchDropdown } from "@/components/ui/dropdown-search"
import { TimePickerDropdown } from "@/components/ui/time-picker"
import { Clock } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"


import {
  EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE,
  employeeLeaveRequestFormSchema,
  type EmployeeLeaveRequestFormValues,
} from "../schema/PersonalTimeStudySchema"

const EMPTY = EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE



function createEmptyRow(): EmployeeLeaveRequestFormValues["entries"][number] {
  return {
    date: "",
    startTime: "",
    endTime: "",
    programCode: EMPTY,
    activityCode: EMPTY,
    totalMinApplied: "",
    comment: "",
  }
}

export type EmployeeLeaveRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Persist draft — optional */
  onSave?: (values: EmployeeLeaveRequestFormValues) => void | Promise<void>
  /** Final submit — optional */
  onSubmit?: (values: EmployeeLeaveRequestFormValues) => void | Promise<void>
  initialValues?: EmployeeLeaveRequestFormValues
  className?: string
  dropdownData?: any[]
  title?: string
  editingStatus?: string | null
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

  return (
    <div className={cn("flex flex-col gap-1 w-full shrink-0", className)}>
      <Popover open={open} onOpenChange={(val) => !disabled && setOpen(val)}>
        <div className="relative">
          <PopoverTrigger asChild>
            <div 
              className={cn("relative cursor-pointer", disabled && "cursor-not-allowed")} 
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault()
                  return
                }
                setOpen(true)
              }}
            >
              <TitleCaseInput
                value={value}
                disabled={disabled}
                placeholder="--:--"
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => {
                  if (disabled) {
                    e.preventDefault()
                    return
                  }
                  setOpen(true)
                }}
                className={cn(
                  "h-10 pr-8 text-sm font-normal rounded-[6px] cursor-pointer w-full",
                  disabled && "cursor-not-allowed bg-muted !text-foreground pointer-events-none !opacity-100"
                )}
              />
              <Clock className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-50" />
            </div>
          </PopoverTrigger>
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
}: EmployeeLeaveRequestDialogProps) {

  const isEditing = !!initialValues;
  const isApproved = editingStatus?.toLowerCase() === "approved";

  const programs = useMemo(() => {
    const list = dropdownData?.flatMap((d: any) => d.programs.map((p: any) => ({ ...p, departmentCode: d.departmentCode }))) ?? []
    const unique = Array.from(new Map(list.map((p: any) => [p.id, p])).values())
    return unique
  }, [dropdownData])

  const activities = useMemo(() => {
    const list = dropdownData?.flatMap((d: any) => d.activities) ?? []
    const unique = Array.from(new Map(list.map((a: any) => [a.id, a])).values())
    return unique
  }, [dropdownData])

  const programQueries = useMemo(() => {
    const list: { departmentId: number; programId: number }[] = []
    for (const bundle of dropdownData ?? []) {
      const deptId = bundle.departmentId
      if (!deptId) continue
      for (const p of bundle.programs) {
        list.push({ departmentId: deptId, programId: p.id })
      }
    }
    return list
  }, [dropdownData])

  const programActivityQueryResults = useGetProgramActivityRelations(programQueries)

  const getActivitiesForProgram = useCallback((programId: string): Set<string> => {
    const index = programQueries.findIndex((pq) => String(pq.programId) === programId)
    if (index === -1) return new Set()
    const result = programActivityQueryResults[index]
    if (!result?.data) return new Set()

    const ids = new Set<string>()
    const roots = result.data.assignedActivities

    function traverse(node: any) {
      if (!node) return
      if (node.assigned) {
        const idStr = String(node.key || "")
        const id = idStr.split("-").pop()
        if (id) ids.add(id)
      }
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
    }

    if (Array.isArray(roots)) {
      for (const deptNode of roots) {
        if (Array.isArray(deptNode.activity)) {
          deptNode.activity.forEach(traverse)
        }
      }
    }
    return ids
  }, [programQueries, programActivityQueryResults])

  const form = useForm<EmployeeLeaveRequestFormValues>({
    resolver: zodResolver(employeeLeaveRequestFormSchema),
    defaultValues: initialValues || {
      entries: [createEmptyRow()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  const formEntries = form.watch("entries")

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
        await onSave?.(data)
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
        await onSubmit?.(data)
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
              <span>Comment</span>
              {!isEditing && <span className="sr-only">Row actions</span>}
            </div>

            <div className="divide-y divide-border">
              {fields.map((field, index) => (
                <div key={field.id} className={getRowGridClass(isEditing)}>

                  {/* Date */}
                  <div className="space-y-1">
                    <Controller
                      control={form.control}
                      name={`entries.${index}.date`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <TitleCaseInput
                            type="date"
                            className="h-10 text-sm rounded-[6px]"
                            {...f}
                          />
                          {fieldState.error?.message && (
                            <p className="text-xs text-destructive">{fieldState.error.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* Start Time — reuses shared TimePicker24h */}
                  <Controller
                    control={form.control}
                    name={`entries.${index}.startTime`}
                    render={({ field: f, fieldState }) => (
                      <div className="space-y-1">
                        <TimePicker24h
                          value={f.value}
                          disabled={isApproved}
                          onChange={(v) => {
                            f.onChange(v)
                            
                            // Auto-add 15 minutes for the end time
                            const newEnd = addMinutesToTime(v, 15)
                            form.setValue(`entries.${index}.endTime`, newEnd, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                            
                            // Calculate total duration using the new end time
                            updateDuration(index, v, newEnd)
                          }}
                          className="w-full"
                        />
                        {fieldState.error?.message && (
                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* End Time — reuses shared TimePicker24h */}
                  <Controller
                    control={form.control}
                    name={`entries.${index}.endTime`}
                    render={({ field: f, fieldState }) => (
                      <div className="space-y-1">
                        <TimePicker24h
                          value={f.value}
                          onChange={(v) => {
                            f.onChange(v)
                            const currentStart = form.getValues(`entries.${index}.startTime`)
                            updateDuration(index, currentStart, v)
                          }}
                          className="w-full"
                        />
                        {fieldState.error?.message && (
                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />

                  {/* Program Code — reuses shared SingleSelectSearchDropdown */}
                  <div className="space-y-1">
                    <Controller
                      control={form.control}
                      name={`entries.${index}.programCode`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <SingleSelectSearchDropdown
                            value={f.value === EMPTY ? "" : f.value}
                            placeholder="Select..."
                            options={programs.map((p: any) => {
                              const deptPrefix = (p.departmentCode ?? '').split('-')[0]
                              return {
                                value: String(p.id),
                                label: `${deptPrefix}-${p.code} - ${p.name}`,
                              }
                            })}
                            onChange={(v) => {
                              f.onChange(v || EMPTY)
                              // Reset activity when program changes
                              form.setValue(`entries.${index}.activityCode`, EMPTY, { shouldValidate: false })
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

                  {/* Activity Code — reuses shared SingleSelectSearchDropdown */}
                  <div className="space-y-1">
                    <Controller
                      control={form.control}
                      name={`entries.${index}.activityCode`}
                      render={({ field: f, fieldState }) => (
                        <>
                          {(() => {
                            const programId = formEntries?.[index]?.programCode
                            const hasProgram = programId && programId !== EMPTY
                            const allowedIds = hasProgram ? getActivitiesForProgram(programId) : new Set<string>()
                            const options = hasProgram 
                              ? activities.filter((a) => allowedIds.has(String(a.id))).map((a: any) => ({
                                  value: String(a.id),
                                  label: `${a.code} - ${a.name}`,
                                }))
                              : []

                            return (
                              <SingleSelectSearchDropdown
                                value={f.value === EMPTY ? "" : f.value}
                                placeholder="Select Activity Code"
                                disabled={!hasProgram}
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
                      name={`entries.${index}.totalMinApplied`}
                      render={({ field: f, fieldState }) => {
                        const originalTotal = Number(initialValues?.entries?.[index]?.totalMinApplied || 0)
                        const currentTotal = Number(f.value || 0)
                        
                        const exceedsOriginal = isApproved && originalTotal > 0 && currentTotal > originalTotal

                        const startTime = formEntries?.[index]?.startTime
                        const endTime = formEntries?.[index]?.endTime
                        const diff = (startTime && endTime) ? calculateMinutesDiff(startTime, endTime) : 0
                        const exceedsCalculated = diff > 0 && currentTotal > diff
                        
                        const isErrorState = exceedsOriginal || exceedsCalculated

                        return (
                          <>
                            <TitleCaseInput
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "h-10 text-sm tabular-nums rounded-[6px]",
                                isApproved && "cursor-not-allowed bg-muted !opacity-100 !text-foreground",
                                isErrorState && "border-destructive text-destructive focus-visible:ring-destructive"
                              )}
                              disabled={isApproved}
                              placeholder="0"
                              autoComplete="off"
                              {...f}
                            />
                            {fieldState.error?.message ? (
                              <p className="text-xs text-destructive">{fieldState.error.message}</p>
                            ) : exceedsCalculated ? (
                              <p className="text-[11px] text-destructive leading-tight">Max allowed is {diff} min</p>
                            ) : exceedsOriginal ? (
                              <p className="text-[11px] text-destructive leading-tight">Exceeds {originalTotal} min</p>
                            ) : null}
                          </>
                        )
                      }}
                    />
                  </div>

                  {/* Comment */}
                  <div className="space-y-1">
                    <Controller
                      control={form.control}
                      name={`entries.${index}.comment`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <TitleCaseInput
                            className="h-10 text-sm rounded-[6px]"
                            placeholder="Comment"
                            {...f}
                          />
                          {fieldState.error?.message && (
                            <p className="text-xs text-destructive">{fieldState.error.message}</p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* Row action: add / remove */}
                  {!isEditing && (
                    <div className="flex items-end justify-center pb-0.5">
                      {index === 0 ? (
                        <Button
                          type="button"
                          size="icon"
                          className="size-10 shrink-0 rounded-[6px] bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
                          onClick={() => append(createEmptyRow())}
                          aria-label="Add leave row"
                        >
                          <Plus className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          className="size-10 shrink-0 rounded-[6px]"
                          onClick={() => remove(index)}
                          aria-label="Remove leave row"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border px-6 py-4 sm:justify-end">
            {editingStatus?.toLowerCase() !== "requested" && editingStatus?.toLowerCase() !== "approved" && (
              <Button
                type="button"
                variant="default"
                disabled={form.formState.isSubmitting || hasExceeded}
                onClick={() => void handleSave()}
                className={cn(
                  "h-10 rounded-[6px] px-8 text-white transition-opacity",
                  (form.formState.isSubmitting || hasExceeded) ? "bg-[#6C5DD3] opacity-50 cursor-not-allowed pointer-events-none" : "bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
                )}
              >
                Save
              </Button>
            )}
            <Button
              type="button"
              disabled={form.formState.isSubmitting || hasExceeded}
              onClick={() => void handleSubmitFinal()}
              className={cn(
                "h-10 rounded-[6px] px-8 text-white transition-opacity",
                (form.formState.isSubmitting || hasExceeded) ? "bg-[#6C5DD3] opacity-50 cursor-not-allowed pointer-events-none" : "bg-[#6C5DD3] hover:bg-[#6C5DD3]/90"
              )}
            >
              Submit
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
