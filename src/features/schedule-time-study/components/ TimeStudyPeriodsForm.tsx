import { zodResolver } from "@hookform/resolvers/zod"
import { OctagonXIcon } from "lucide-react"
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
import {
  timeStudyPeriodsDefaultValues,
  timeStudyPeriodsFormSchema,
} from "../schemas"
import type {
  DateInputValue,
  FiscalYearMonthRange,
  FiscalYearValue,
  ParsedMmDdYyyyDate,
  TimeStudyPeriodsDepartmentValue,
  TimeStudyPeriodsEditingRow,
  TimeStudyPeriodsFormProps,
  TimeStudyPeriodsFormValues,
} from "../types"
import { DEPARTMENT_LABEL_MAP, FISCAL_YEAR_OPTIONS } from "../types"

function getCurrentMonthRangeForFiscalYear(
  fiscalYear: FiscalYearValue
): FiscalYearMonthRange | null {
  const [startYearText, endYearText] = fiscalYear.split("-")
  const startYear = Number(startYearText)
  const endYear = Number(endYearText)
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return null
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1

  // Fiscal year mapping:
  // Jul-Dec belong to startYear, Jan-Jun belong to endYear.
  const mappedYear = currentMonth >= 7 ? startYear : endYear
  const monthText = String(currentMonth).padStart(2, "0")
  const lastDayOfMonth = new Date(mappedYear, currentMonth, 0).getDate()

  const startDate = `${monthText}-01-${mappedYear}`
  const endDate = `${monthText}-${String(lastDayOfMonth).padStart(2, "0")}-${mappedYear}`
  return { startDate, endDate }
}

function parseMmDdYyyy(value: DateInputValue): ParsedMmDdYyyyDate {
  const [monthText, dayText, yearText] = value.split("-")
  const month = Number(monthText)
  const day = Number(dayText)
  const year = Number(yearText)
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    return null
  }
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return null
  }
  const parsed = new Date(year, month - 1, day)
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }
  return parsed
}

function convertYyyyMmDdToMmDdYyyy(value: DateInputValue): DateInputValue {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${month}-${day}-${year}`
}

function normalizeDateInputValue(value: DateInputValue): DateInputValue {
  return convertYyyyMmDdToMmDdYyyy(value.trim())
}

function convertMmDdYyyyToYyyyMmDd(value: DateInputValue): DateInputValue {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim())
  if (!match) return ""
  const [, month, day, year] = match
  return `${year}-${month}-${day}`
}

function getFiscalYearFromDate(dateValue: DateInputValue): FiscalYearValue {
  const parsed = parseMmDdYyyy(normalizeDateInputValue(dateValue))
  if (!parsed) return "2025-2026"
  const month = parsed.getMonth() + 1
  const year = parsed.getFullYear()
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

function countWeekdaysInclusive(
  startDateValue: DateInputValue,
  endDateValue: DateInputValue
): number {
  const normalizedStart = normalizeDateInputValue(startDateValue)
  const normalizedEnd = normalizeDateInputValue(endDateValue)
  const start = parseMmDdYyyy(normalizedStart)
  const end = parseMmDdYyyy(normalizedEnd)
  if (!start || !end) {
    return 0
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0
  }

  let weekdays = 0
  const current = new Date(start)
  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) {
      weekdays += 1
    }
    current.setDate(current.getDate() + 1)
  }
  return weekdays
}

export function TimeStudyPeriodsForm({
  open,
  onOpenChange,
  selectedDepartment,
  onSave,
  editingRow,
}: TimeStudyPeriodsFormProps) {
  const isCreateMode = !editingRow
  const initialFormValues = buildFormValues(selectedDepartment, editingRow)

  const form = useForm<TimeStudyPeriodsFormValues>({
    resolver: zodResolver(timeStudyPeriodsFormSchema),
    defaultValues: initialFormValues,
  })

  const resetFormToDefaults = () => {
    form.reset(buildFormValues(selectedDepartment, editingRow))
  }

  const onSubmit = form.handleSubmit(
    (values) => {
      const toNumber = (value: string) => {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : 0
      }

      const autoPeriodLabel = values.timeStudyPeriod.trim() || `${values.fiscalYear} Time Study`

      onSave({
        id: editingRow?.id ?? `stsp-${Date.now()}`,
        timeStudyPeriod: autoPeriodLabel,
        startDate: values.startDate,
        endDate: values.endDate,
        hours: toNumber(values.hours),
        holidays: toNumber(values.holidays),
        allocable: toNumber(values.allocable),
        nonAllocable: toNumber(values.nonAllocable),
      })
      onOpenChange(false)
      resetFormToDefaults()
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

  const departmentLabel = DEPARTMENT_LABEL_MAP[selectedDepartment] ?? "Social Services"

  const applyComputedValues = (startDateValue: string, endDateValue: string) => {
    const weekdays = countWeekdaysInclusive(startDateValue, endDateValue)
    const totalHours = weekdays * 8
    const totalHolidays = 1
    const holidayHours = totalHolidays * 8
    const allocableHours = Math.max(totalHours - holidayHours, 0)

    form.setValue("hours", String(totalHours), { shouldValidate: true })
    form.setValue("holidays", String(totalHolidays), { shouldValidate: true })
    form.setValue("allocable", String(allocableHours), { shouldValidate: true })
    form.setValue("nonAllocable", String(holidayHours), { shouldValidate: true })
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
            <div className="mb-3 flex justify-end gap-6 text-[16px] text-black">
              <span>Total: {allocable || "0"}</span>
              <span>{nonAllocable || "0"}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-end gap-6">
                <div className="space-y-1">
                  <Label className="text-[14px] font-normal text-black">Select Fiscal Year</Label>
                  <Select
                    value={fiscalYear}
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
                      form.setValue("fiscalYear", value, { shouldValidate: true })
                      const dateRange = getCurrentMonthRangeForFiscalYear(value)
                      if (!dateRange) return
                      form.setValue("startDate", dateRange.startDate, { shouldValidate: true })
                      form.setValue("endDate", dateRange.endDate, { shouldValidate: true })
                      applyComputedValues(dateRange.startDate, dateRange.endDate)
                    }}
                  >
                    <SelectTrigger className="h-12 w-[150px] rounded-[10px] border-[#D1D5DB] px-[11px] text-[14px]">
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      avoidCollisions={false}
                      sideOffset={10}
                      align="start"
                      className="w-[150px] rounded-[10px] border border-[#E5E7EB] p-1"
                    >
                      {FISCAL_YEAR_OPTIONS.map((year) => (
                        <SelectItem
                          key={year}
                          value={year}
                          className={cn(
                            "h-[42px] rounded-[8px] px-4 pr-4 text-[14px] font-normal [&>span:first-child]:hidden",
                            fiscalYear === year && "bg-[#EEF0FF] text-[#6C5DD3]"
                          )}
                        >
                          {year}
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
                    value={isCreateDateEditable ? convertMmDdYyyyToYyyyMmDd(startDate) : startDate}
                    onChange={(event) =>
                      {
                        const nextStartDate = normalizeDateInputValue(event.target.value)
                        form.setValue("startDate", nextStartDate, { shouldValidate: true })
                        applyComputedValues(nextStartDate, endDate)
                      }
                    }
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
                    value={isCreateDateEditable ? convertMmDdYyyyToYyyyMmDd(endDate) : endDate}
                    onChange={(event) =>
                      {
                        const nextEndDate = normalizeDateInputValue(event.target.value)
                        form.setValue("endDate", nextEndDate, { shouldValidate: true })
                        applyComputedValues(startDate, nextEndDate)
                      }
                    }
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
