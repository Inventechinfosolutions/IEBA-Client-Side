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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE,
  employeeLeaveRequestFormSchema,
  type EmployeeLeaveRequestFormValues,
} from "../schemas/employeeLeaveRequestSchema"

const EMPTY = EMPLOYEE_LEAVE_EMPTY_SELECT_VALUE

/** Placeholder options — replace with `useGetPersonalTimeStudyMasterCodes` when APIs exist. */
const PROGRAM_CODE_OPTIONS = ["PRG-100", "PRG-200", "PRG-300"] as const
const ACTIVITY_CODE_OPTIONS = ["ACT-10", "ACT-20", "ACT-30"] as const

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
  "grid min-w-[920px] grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(5.5rem,0.75fr)_minmax(10rem,1.2fr)_2.5rem] items-end gap-2 border-b border-border pb-2 text-xs font-medium text-muted-foreground"

const rowGridClass =
  "grid min-w-[920px] grid-cols-[minmax(8.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(6.5rem,0.9fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(5.5rem,0.75fr)_minmax(10rem,1.2fr)_2.5rem] items-center gap-2 py-2"

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

  const handleClose = useCallback(
    (next: boolean) => {
      if (!next) {
        resetForm()
      }
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
          "flex max-h-[min(90vh,800px)] w-full max-w-[min(96vw,1100px)] flex-col gap-0 overflow-hidden p-0 sm:rounded-lg",
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
                  <div className="space-y-1">
                    <Label className="sr-only">Date</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.date`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Input
                            type="date"
                            className="h-9 text-sm"
                            {...f}
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">Start Time</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.startTime`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Input
                            type="time"
                            className="h-9 text-sm"
                            {...f}
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">End Time</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.endTime`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Input
                            type="time"
                            className="h-9 text-sm"
                            {...f}
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">Program Code</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.programCode`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Select
                            value={f.value === "" ? EMPTY : f.value}
                            onValueChange={f.onChange}
                          >
                            <SelectTrigger className="h-9 w-full text-sm">
                              <SelectValue placeholder="Program Code" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY} disabled>
                                Select…
                              </SelectItem>
                              {PROGRAM_CODE_OPTIONS.map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">Activity Code</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.activityCode`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Select
                            value={f.value === "" ? EMPTY : f.value}
                            onValueChange={f.onChange}
                          >
                            <SelectTrigger className="h-9 w-full text-sm">
                              <SelectValue placeholder="Activity Code" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY} disabled>
                                Select…
                              </SelectItem>
                              {ACTIVITY_CODE_OPTIONS.map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">Total Min Applied</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.totalMinApplied`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Input
                            type="text"
                            inputMode="numeric"
                            className="h-9 text-sm tabular-nums"
                            placeholder="0"
                            autoComplete="off"
                            {...f}
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="sr-only">Comment</Label>
                    <Controller
                      control={form.control}
                      name={`entries.${index}.comment`}
                      render={({ field: f, fieldState }) => (
                        <>
                          <Input
                            className="h-9 text-sm"
                            placeholder="Comment"
                            {...f}
                          />
                          {fieldState.error?.message ? (
                            <p className="text-xs text-destructive">
                              {fieldState.error.message}
                            </p>
                          ) : null}
                        </>
                      )}
                    />
                  </div>

                  <div className="flex justify-center">
                    {index === 0 ? (
                      <Button
                        type="button"
                        size="icon"
                        className="size-9 shrink-0"
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
                        className="size-9 shrink-0"
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
            >
              Save
            </Button>
            <Button
              type="button"
              disabled={form.formState.isSubmitting}
              onClick={() => void handleSubmitFinal()}
            >
              Submit
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleClose(false)}
            >
              Exit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
