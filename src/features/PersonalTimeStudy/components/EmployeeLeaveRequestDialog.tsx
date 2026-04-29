import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useCallback } from "react"
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
import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import {
  EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE,
  employeeLeaveRequestFormSchema,
  type EmployeeLeaveRequestFormValues,
} from "../schemas/employeeLeaveRequestSchema"

const EMPTY = EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE

/** Placeholder options — replace with API-driven data when available. */
const PROGRAM_CODE_OPTIONS = [
  { value: "PRG-100", label: "PRG-100" },
  { value: "PRG-200", label: "PRG-200" },
  { value: "PRG-300", label: "PRG-300" },
]
const ACTIVITY_CODE_OPTIONS = [
  { value: "ACT-10", label: "ACT-10" },
  { value: "ACT-20", label: "ACT-20" },
  { value: "ACT-30", label: "ACT-30" },
]

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
  className?: string
}

const headerGridClass =
  "grid min-w-[1020px] grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)_2.5rem] items-end gap-4 text-[14px] font-normal text-[#4A4A4A] whitespace-nowrap"

const rowGridClass =
  "grid min-w-[1020px] grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(10rem,1.5fr)_minmax(10rem,1.5fr)_minmax(8.5rem,1fr)_minmax(10rem,1.2fr)_2.5rem] items-end gap-4 py-2"

function TimePicker24h({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("flex flex-col gap-1 w-full shrink-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <div className="relative cursor-pointer" onClick={() => setOpen(true)}>
              <TitleCaseInput
                value={value}
                placeholder="--:--"
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setOpen(true)}
                className="h-10 pr-8 text-sm font-normal rounded-[6px] cursor-pointer w-full"
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

export function EmployeeLeaveRequestDialog({
  open,
  onOpenChange,
  onSave,
  onSubmit,
  className,
}: EmployeeLeaveRequestDialogProps) {
  const form = useForm<EmployeeLeaveRequestFormValues>({
    resolver: zodResolver(employeeLeaveRequestFormSchema),
    defaultValues: {
      entries: [createEmptyRow()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

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

  const handleSave = form.handleSubmit(
    async (data) => {
      await onSave?.(data)
      toast.success("Leave request saved")
    },
    () => {
      const err =
        form.formState.errors.entries?.root?.message ||
        form.formState.errors.entries?.[0]?.date?.message ||
        "Please fix validation errors"
      toast.error(String(err))
    }
  )

  const handleSubmitFinal = form.handleSubmit(
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
  )

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
            Employee Leave Request
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto px-4 py-3 sm:px-6">
            {/* Column headers */}
            <div className={headerGridClass}>
              <span>Date</span>
              <span>Start Time</span>
              <span>End Time</span>
              <span>Program Code</span>
              <span>Activity Code</span>
              <span>Total Min Applied</span>
              <span>Comment</span>
              <span className="sr-only">Row actions</span>
            </div>

            <div className="divide-y divide-border">
              {fields.map((field, index) => (
                <div key={field.id} className={rowGridClass}>

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
                          onChange={(v) => {
                            f.onChange(v)
                            const currentEnd = form.getValues(`entries.${index}.endTime`)
                            updateDuration(index, v, currentEnd)
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
                            options={PROGRAM_CODE_OPTIONS}
                            onChange={(v) => f.onChange(v || EMPTY)}
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
                          <SingleSelectSearchDropdown
                            value={f.value === EMPTY ? "" : f.value}
                            placeholder="Select..."
                            options={ACTIVITY_CODE_OPTIONS}
                            onChange={(v) => f.onChange(v || EMPTY)}
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

                  {/* Total Min Applied */}
                  <div className="space-y-1">
                    <Controller
                      control={form.control}
                      name={`entries.${index}.totalMinApplied`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <TitleCaseInput
                            type="text"
                            inputMode="numeric"
                            className="h-10 text-sm tabular-nums rounded-[6px]"
                            placeholder="0"
                            autoComplete="off"
                            {...f}
                          />
                          {fieldState.error?.message && (
                            <p className="text-xs text-destructive">{fieldState.error.message}</p>
                          )}
                        </>
                      )}
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

                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-row gap-2 border-t border-border px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="default"
              disabled={form.formState.isSubmitting}
              onClick={() => void handleSave()}
              className="h-10 rounded-[6px] bg-[#6C5DD3] hover:bg-[#6C5DD3]/90 px-8 text-white"
            >
              Save
            </Button>
            <Button
              type="button"
              disabled={form.formState.isSubmitting}
              onClick={() => void handleSubmitFinal()}
              className="h-10 rounded-[6px] bg-[#6C5DD3] hover:bg-[#6C5DD3]/90 px-8 text-white"
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
