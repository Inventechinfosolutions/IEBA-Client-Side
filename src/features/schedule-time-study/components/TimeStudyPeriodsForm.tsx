import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Check, OctagonXIcon } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
import { scheduleTimeStudyKeys } from "../keys"
import { useCreateRmtsPayPeriod } from "../mutations/createRmtsPayPeriod"
import { useUpdateRmtsPayPeriod } from "../mutations/updateRmtsPayPeriod"
import { useGetRmtsPayPeriodById } from "../queries/getRmtsPayPeriodById"
import { fetchScheduleTimeStudyHolidayListByDateRange } from "../queries/getHolidayListByDateRange"
import { fetchScheduleTimeStudyPeriodRows } from "../queries/getRmtsPayPeriods"
import {
  timeStudyPeriodsDefaultValues,
  timeStudyPeriodsFormSchema,
} from "../schemas"
import type {
  CreateRmtsPayPeriodPayload,
  DateInputValue,
  FiscalYearMonthRange,
  FiscalYearValue,
  HolidayCalendarApiDto,
  ScheduleTimeStudyFiscalYearOption,
  TimeStudyPeriodsDepartmentValue,
  TimeStudyPeriodsEditingRow,
  TimeStudyPeriodsFormProps,
  TimeStudyPeriodsFormValues,
} from "../types"
import {
  buildHolidayIdsCsv,
  countWeekdaysInclusive as countWeekdaysInclusiveInRange,
  filterWeekdayHolidaysInPayPeriodRange,
} from "../utils/holidayPayPeriod"
import {
  addDaysMmDdYyyy,
  endOfMonthMmDdYyyy,
  isStartOnOrBeforeEnd,
  normalizeDateInputValue,
  toDateInputValue,
} from "../utils/dates"

const payPeriodUpdateSuccessToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
      <Check className="size-3 stroke-3" />
    </span>
  ),
  className:
    "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
}

function getFiscalYearOptionById(
  options: readonly ScheduleTimeStudyFiscalYearOption[],
  id: FiscalYearValue,
): ScheduleTimeStudyFiscalYearOption | undefined {
  return options.find((fy) => fy.id === id)
}


function getDefaultPeriodRangeFromFiscalYearOption(
  option: ScheduleTimeStudyFiscalYearOption | undefined,
): FiscalYearMonthRange | null {
  const fyStart = option?.start?.trim()
  if (!fyStart) return null
  const end = endOfMonthMmDdYyyy(fyStart)
  if (!end) return null
  return { startDate: fyStart, endDate: end }
}

function buildPayPeriodNameUniqueKey(params: {
  name: string
  fiscalyear: string
  departmentId: number
}): string {
  return `${params.name.trim()}-${params.fiscalyear.trim()}-${params.departmentId}`
}

function buildUniquePayPeriodName(params: {
  userEnteredName: string
  fiscalyear: string
  startDate: string
  endDate: string
  existingNames: readonly string[]
}): string {
  const typed = params.userEnteredName.trim()
  if (typed) return typed

  const base = `${params.fiscalyear.trim()} Time Study`.trim()
  const existing = new Set(params.existingNames.map((n) => n.trim()).filter(Boolean))

  // Prefer a stable, descriptive fallback first.
  const withRange = `${base} ${params.startDate.trim()}-${params.endDate.trim()}`.trim()
  if (!existing.has(base) && !existing.has(withRange)) return base
  if (!existing.has(withRange)) return withRange

  // Last resort: numbered suffix.
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${withRange} (${i})`
    if (!existing.has(candidate)) return candidate
  }

  return `${withRange} (${Date.now()})`
}

function getFiscalYearFromDate(dateValue: DateInputValue): FiscalYearValue {
  // Kept for edit mode: infer FY label from a pay period start date.
  const normalized = normalizeDateInputValue(dateValue)
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(normalized)
  if (!match) return "2025-2026"
  const month = Number(match[1])
  const year = Number(match[3])
  if (!Number.isFinite(month) || !Number.isFinite(year)) return "2025-2026"
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function isPreviousFiscalYear(fiscalYear: FiscalYearValue): boolean {
  const [selectedStartYearText] = fiscalYear.split("-")
  const selectedStartYear = Number(selectedStartYearText)
  if (!Number.isFinite(selectedStartYear)) {
    return false
  }

  const now = new Date()
  const currentStartYear = now.getMonth() + 1 >= 7 ? now.getFullYear() : now.getFullYear() - 1
  return selectedStartYear < currentStartYear
}

function buildFormValues(
  selectedDepartment: TimeStudyPeriodsDepartmentValue,
  editingRow?: TimeStudyPeriodsEditingRow
): TimeStudyPeriodsFormValues {
  if (!editingRow) {
    return {
      ...timeStudyPeriodsDefaultValues,
      department: selectedDepartment,
    }
  }

  const normalizedStartDate = normalizeDateInputValue(editingRow.startDate)
  const normalizedEndDate = normalizeDateInputValue(editingRow.endDate)

  return {
    ...timeStudyPeriodsDefaultValues,
    fiscalYear: getFiscalYearFromDate(normalizedStartDate),
    department: selectedDepartment,
    timeStudyPeriod: editingRow.timeStudyPeriod,
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    hours: String(editingRow.hours),
    holidays: String(editingRow.holidays),
    allocable: String(editingRow.allocable),
    nonAllocable: String(editingRow.nonAllocable),
  }
}

export function TimeStudyPeriodsForm({
  open,
  onOpenChange,
  selectedDepartment,
  selectedDepartmentName,
  departmentId,
  fiscalYearOptions,
  editingRow,
}: TimeStudyPeriodsFormProps) {
  const isCreateMode = !editingRow
  const editingPayPeriodIdForQuery = useMemo(() => {
    if (!editingRow) return null
    const n = Number(editingRow.id)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [editingRow])

  useGetRmtsPayPeriodById({
    id: editingPayPeriodIdForQuery,
    enabled: open && editingPayPeriodIdForQuery != null,
  })

  const initialFormValues = buildFormValues(selectedDepartment, editingRow)
  const queryClient = useQueryClient()
  const lastHolidayIdsCsvRef = useRef("")
  const [isHolidayFetchPending, setIsHolidayFetchPending] = useState(false)

  const form = useForm<TimeStudyPeriodsFormValues>({
    resolver: zodResolver(timeStudyPeriodsFormSchema),
    defaultValues: initialFormValues,
  })

  const createPayPeriod = useCreateRmtsPayPeriod()
  const updatePayPeriod = useUpdateRmtsPayPeriod()

  const resetFormToDefaults = () => {
    form.reset(buildFormValues(selectedDepartment, editingRow))
  }

  const friendlyPayPeriodSaveError = (error: unknown, payPeriodName: string) => {
    const message = error instanceof Error ? error.message : ""
    const lower = message.toLowerCase()
    const isDuplicate =
      lower.includes("duplicate entry") &&
      (lower.includes("rmtspayperiods") || lower.includes("idx_"))
    if (isDuplicate) {
      const deptLabel = selectedDepartmentName.trim() || "this department"
      const label = payPeriodName.trim() ? `"${payPeriodName.trim()}"` : "This pay period"
      return `${label} already exists for department ${deptLabel}.`
    }
    return null
  }

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        if (departmentId == null || departmentId <= 0) {
          toast.error("Department is not ready for saving. Try again in a moment.")
          return
        }

        // Prevent backend unique-index duplicate. Backend appears to enforce uniqueness
        // by (name + fiscalyear + departmentId) and/or (month(startdt) + fiscalyear + departmentId).
        {
          const fy = values.fiscalYear.trim()
          const existing = await queryClient.fetchQuery({
            queryKey: scheduleTimeStudyKeys.payPeriodList({
              departmentId,
              fiscalyear: fy,
            }),
            queryFn: () => fetchScheduleTimeStudyPeriodRows({ departmentId, fiscalyear: fy }),
          })

          const editingId = editingRow ? Number(editingRow.id) : null
          const existingNames = existing
            .map((pp) => String(pp.timeStudyPeriod ?? "").trim())
            .filter(Boolean)

          const autoPeriodLabel = buildUniquePayPeriodName({
            userEnteredName: values.timeStudyPeriod,
            fiscalyear: values.fiscalYear,
            startDate: values.startDate,
            endDate: values.endDate,
            existingNames,
          })
          const nameKey = buildPayPeriodNameUniqueKey({
            name: autoPeriodLabel,
            fiscalyear: values.fiscalYear,
            departmentId,
          })

          const duplicate = existing.find((pp) => {
            const ppId = typeof pp.id === "number" ? pp.id : Number(pp.id)
            if (editingId != null && Number.isFinite(editingId) && ppId === editingId) return false

            const ppNameKey = buildPayPeriodNameUniqueKey({
              name: pp.timeStudyPeriod ?? "",
              fiscalyear: values.fiscalYear,
              departmentId,
            })
            return ppNameKey === nameKey
          })

          if (duplicate) {
            toast.error("Pay period name already exists for this fiscal year and department.")
            return
          }

          // If the user left the name blank, persist the auto-generated unique name so
          // the saved record matches what they see.
          if (!values.timeStudyPeriod.trim()) {
            form.setValue("timeStudyPeriod", autoPeriodLabel, { shouldValidate: true })
          }
        }

        // Intentionally allow saving outside fiscal-year bounds (per requirement).

        const toNumber = (value: string) => {
          const parsed = Number(value)
          return Number.isFinite(parsed) ? parsed : 0
        }

        // If blank, it was already auto-generated in the duplicate-precheck above.
        const autoPeriodLabel = values.timeStudyPeriod.trim() || `${values.fiscalYear} Time Study`

        const holidayDayCount = toNumber(values.holidays)
        const payload: CreateRmtsPayPeriodPayload = {
          name: autoPeriodLabel,
          startdt: values.startDate,
          enddt: values.endDate,
          hours: toNumber(values.hours),
          holidayhours: holidayDayCount,
          allocatetime: toNumber(values.allocable),
          nonallocatetime: toNumber(values.nonAllocable),
          departmentId,
          fiscalyear: values.fiscalYear,
          holidays:
            lastHolidayIdsCsvRef.current.trim().length > 0
              ? lastHolidayIdsCsvRef.current.trim()
              : undefined,
        }

        if (editingRow) {
          const id = Number(editingRow.id)
          if (!Number.isFinite(id) || id <= 0) {
            throw new Error("Invalid pay period id")
          }
          await updatePayPeriod.mutateAsync({ id, body: payload })
          toast.success("Pay periods updated successfully", payPeriodUpdateSuccessToastOptions)
        } else {
          await createPayPeriod.mutateAsync(payload)
          toast.success("Pay periods created successfully", payPeriodUpdateSuccessToastOptions)
        }
        onOpenChange(false)
        resetFormToDefaults()
      } catch (error) {
        const attemptedName =
          values.timeStudyPeriod.trim() || `${values.fiscalYear.trim()} Time Study`.trim()
        const friendly = friendlyPayPeriodSaveError(error, attemptedName)
        toast.error(friendly ?? (error instanceof Error ? error.message : "Save failed"))
      }
    },
    (errors) => {
      const first = Object.values(errors)[0]
      const message =
        first && typeof first === "object" && "message" in first && typeof first.message === "string"
          ? first.message
          : "Please fix the errors in the form"
      toast.error(message)
    }
  )

  const fiscalYear = form.watch("fiscalYear")
  const timeStudyPeriod = form.watch("timeStudyPeriod")
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const hours = form.watch("hours")
  const holidays = form.watch("holidays")
  const allocable = form.watch("allocable")
  const nonAllocable = form.watch("nonAllocable")
  const isCreateDateEditable = !isCreateMode || fiscalYear.trim().length > 0

  const departmentLabel = selectedDepartmentName.trim() || "—"

  const applyComputedValues = (
    startDateValue: string,
    endDateValue: string,
    holidayRows: HolidayCalendarApiDto[],
  ) => {
    const weekdays = countWeekdaysInclusiveInRange(startDateValue, endDateValue)
    const qualifying = filterWeekdayHolidaysInPayPeriodRange(
      startDateValue,
      endDateValue,
      holidayRows,
    )
    lastHolidayIdsCsvRef.current = buildHolidayIdsCsv(qualifying)

    const totalHours = weekdays * 8
    const holidayDayCount = qualifying.length
    const holidayHours = holidayDayCount * 8
    const allocableHours = Math.max(totalHours - holidayHours, 0)

    form.setValue("hours", String(totalHours), { shouldValidate: true })
    form.setValue("holidays", String(holidayDayCount), { shouldValidate: true })
    form.setValue("allocable", String(allocableHours), { shouldValidate: true })
    form.setValue("nonAllocable", String(holidayHours), { shouldValidate: true })
  }

  const fetchHolidaysAndApply = async (startDateValue: string, endDateValue: string) => {
    const start = normalizeDateInputValue(startDateValue)
    const end = normalizeDateInputValue(endDateValue)
    if (!isStartOnOrBeforeEnd(start, end)) {
      toast.error("Start date must be on or before end date.")
      lastHolidayIdsCsvRef.current = ""
      applyComputedValues(startDateValue, endDateValue, [])
      return
    }

    // Intentionally allow editing outside fiscal-year bounds (per requirement).

    setIsHolidayFetchPending(true)
    try {
      const list = await queryClient.fetchQuery({
        queryKey: scheduleTimeStudyKeys.holidayList(start, end),
        queryFn: () =>
          fetchScheduleTimeStudyHolidayListByDateRange({
            startmonth: start,
            endmonth: end,
          }),
      })
      applyComputedValues(startDateValue, endDateValue, list)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load holidays")
      lastHolidayIdsCsvRef.current = ""
      applyComputedValues(startDateValue, endDateValue, [])
    } finally {
      setIsHolidayFetchPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        showClose={false}
        className="min-h-[460px] w-[1220px] max-w-[calc(100vw-2rem)] rounded-[12px] border border-[#E5E7EB] bg-white p-[20px_24px]"
        overlayClassName="bg-black/45"
      >
        <DialogTitle className="text-center text-[20px] font-medium text-black">
          {editingRow ? "Edit Time Study Period" : "Create Time Study Periods"}
        </DialogTitle>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-[10px] border border-[#E5E7EB] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-end gap-4 text-[16px] text-black">
              {isHolidayFetchPending ? (
                <span className="text-[13px] font-normal text-muted-foreground">
                  Loading holidays…
                </span>
              ) : null}
              <span>Total: {allocable || "0"}</span>
              <span>{nonAllocable || "0"}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-6">
                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Fiscal Year</Label>
                  <Select
                    value={fiscalYear || undefined}
                    onValueChange={(value) => {
                      if (isCreateMode && isPreviousFiscalYear(value)) {
                        toast.error("Cannot create pay period for previous fiscal years.", {
                          icon: <OctagonXIcon className="size-4 text-red-500" />,
                          classNames: {
                            toast: "w-fit max-w-none",
                            title: "whitespace-nowrap",
                            closeButton: "text-red-500 hover:text-red-600",
                          },
                        })
                        return
                      }
                      const option = getFiscalYearOptionById(fiscalYearOptions, value)
                      const dateRange = getDefaultPeriodRangeFromFiscalYearOption(option)
                      if (!dateRange) {
                        toast.error(
                          "Fiscal year start date is missing in settings. Update fiscal year data or pick another year.",
                        )
                        return
                      }
                      form.setValue("fiscalYear", value, { shouldValidate: true })
                      form.setValue("startDate", dateRange.startDate, { shouldValidate: true })
                      form.setValue("endDate", dateRange.endDate, { shouldValidate: true })
                      void fetchHolidaysAndApply(dateRange.startDate, dateRange.endDate)
                    }}
                  >
                    <SelectTrigger className="h-12 min-w-[160px] rounded-[10px] border-[#D1D5DB] px-[11px] text-[14px]">
                      <SelectValue placeholder="Select fiscal year" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      avoidCollisions={false}
                      sideOffset={10}
                      align="start"
                    className="min-w-[180px] rounded-[10px] border border-[#E5E7EB] p-1"
                  >
                      {fiscalYearOptions.length === 0 ? (
                        <div className="px-3 py-2 text-[13px] text-muted-foreground">
                          No fiscal years loaded
                        </div>
                      ) : null}
                      {fiscalYearOptions.map((fy) => (
                        <SelectItem
                          key={fy.id}
                          value={fy.id}
                          className={cn(
                            "h-[42px] rounded-[8px] px-4 pr-4 text-[14px] font-normal [&>span:first-child]:hidden",
                            fiscalYear === fy.id && "bg-[#EEF0FF] text-[#6C5DD3]"
                          )}
                        >
                          {fy.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Department</Label>
                  <Input
                    value={departmentLabel}
                    readOnly
                    className="h-12 w-[150px] cursor-not-allowed rounded-[10px] border-[#D1D5DB] bg-[#F9FAFB] px-[11px] text-[14px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Time Study Period</Label>
                  <Input
                    className="h-10 rounded-[14px] border-[#D1D5DB]"
                    value={timeStudyPeriod}
                    onChange={(event) =>
                      form.setValue("timeStudyPeriod", event.target.value, {
                        shouldValidate: true,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Start Date</Label>
                  <Input
                    readOnly={!isCreateDateEditable}
                    type={isCreateDateEditable ? "date" : "text"}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB] text-[14px]",
                      "placeholder:text-[#9CA3AF]",
                      !isCreateDateEditable && "cursor-not-allowed bg-[#F9FAFB]",
                      isCreateDateEditable &&
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                    )}
                    placeholder="MM-DD-YYYY"
                    value={isCreateDateEditable ? toDateInputValue(startDate) : startDate}
                    onChange={(event) => {
                      const nextStartDate = normalizeDateInputValue(event.target.value)
                      form.setValue("startDate", nextStartDate, { shouldValidate: true })

                      const computedEnd = addDaysMmDdYyyy(nextStartDate, 30)
                      if (computedEnd) {
                        form.setValue("endDate", computedEnd, { shouldValidate: true })
                        void fetchHolidaysAndApply(nextStartDate, computedEnd)
                      } else {
                        void fetchHolidaysAndApply(nextStartDate, endDate)
                      }
                      }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">End Date</Label>
                  <Input
                    readOnly={!isCreateDateEditable}
                    type={isCreateDateEditable ? "date" : "text"}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB] text-[14px]",
                      "placeholder:text-[#9CA3AF]",
                      !isCreateDateEditable && "cursor-not-allowed bg-[#F9FAFB]",
                      isCreateDateEditable &&
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100"
                    )}
                    placeholder="MM-DD-YYYY"
                    value={isCreateDateEditable ? toDateInputValue(endDate) : endDate}
                    onChange={(event) => {
                      const nextEndDate = normalizeDateInputValue(event.target.value)
                      form.setValue("endDate", nextEndDate, { shouldValidate: true })
                      void fetchHolidaysAndApply(startDate, nextEndDate)
                      }}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">
                    Hours <span className="text-[12px]">(8 hrs/day)</span>
                  </Label>
                  <Input
                    readOnly={isCreateMode}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB]",
                      isCreateMode && "cursor-not-allowed bg-[#F9FAFB]"
                    )}
                    value={hours}
                    onChange={(event) => form.setValue("hours", event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Holidays</Label>
                  <Input
                    readOnly={isCreateMode}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB]",
                      isCreateMode && "cursor-not-allowed bg-[#F9FAFB]"
                    )}
                    value={holidays}
                    onChange={(event) => form.setValue("holidays", event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Allocable</Label>
                  <Input
                    readOnly={isCreateMode}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB]",
                      isCreateMode && "cursor-not-allowed bg-[#F9FAFB]"
                    )}
                    value={allocable}
                    onChange={(event) => form.setValue("allocable", event.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Non-Allocable</Label>
                  <Input
                    readOnly={isCreateMode}
                    className={cn(
                      "h-10 rounded-[14px] border-[#D1D5DB]",
                      isCreateMode && "cursor-not-allowed bg-[#F9FAFB]"
                    )}
                    value={nonAllocable}
                    onChange={(event) => form.setValue("nonAllocable", event.target.value)}
                  />
                </div>
              </div>

              {null}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              className="h-[54px] w-[101px] rounded-[14px] bg-[#6C5DD3] text-[14px] font-medium text-white hover:bg-[#5D4FC4]"
            >
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-[54px] w-[120px] rounded-[14px] bg-[#D9D9D9] text-[14px] font-medium text-black hover:bg-[#CFCFCF]"
              onClick={() => onOpenChange(false)}
            >
              Exit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
