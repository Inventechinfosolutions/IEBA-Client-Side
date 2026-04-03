import { useState } from "react"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import type { SettingsFormValues } from "@/features/settings/types"
import { FiscalYearTable } from "./FiscalYearTable"
import type { HolidayDatePickerProps, HolidayDraft, MonthYearPickerProps } from "./types"
import { monthLabels } from "./types"
import { fiscalYearHolidaySchema } from "./schema"
import { cn } from "@/lib/utils"

const labelClassName =
  "mb-2 block text-[12px] font-normal text-[var(--primary)]"

const topDateButtonClassName =
  "h-[40px] w-[150px] justify-between rounded-[6px] border border-[#d6d7dc] !bg-white px-3 text-[12px] font-normal text-[#111827] hover:!bg-white focus-visible:!bg-white data-[state=open]:!bg-white"

const fiscalYearErrorToastOptions = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
      <X className="size-3 stroke-[2.5]" />
    </span>
  ),
}

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  const date = new Date(year, monthIndex, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function toDisplayDate(value: string): string {
  const date = parseIsoDate(value)
  if (!date) return ""
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return `${dd}-${mm}-${date.getFullYear()}`
}

function HolidayDatePicker({
  value,
  onChange,
}: HolidayDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const hasValue = Boolean(value)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => selected ?? new Date())

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setCalendarMonth(parseIsoDate(value) ?? new Date())
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="group h-[40px] w-full justify-between rounded-[6px] border border-[#d6d7dc] !bg-white px-3 !text-[14px] font-normal text-[#111827] hover:!bg-white focus-visible:!bg-white aria-expanded:!bg-white data-[state=open]:!bg-white"
        >
          <span className={cn(hasValue ? "text-[#111827]" : "text-[#b5bcc9]")}>
            {toDisplayDate(value) || "DD-MM-YYYY"}
          </span>
          <span
            role={hasValue ? "button" : undefined}
            tabIndex={hasValue ? 0 : -1}
            aria-label={hasValue ? "Clear selected date" : "Open date picker"}
            className="relative inline-flex size-4 items-center justify-center"
            onPointerDown={(event) => {
              if (!hasValue) return
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              if (!hasValue) return
              event.preventDefault()
              event.stopPropagation()
              onChange("")
              setOpen(false)
            }}
          >
            <CalendarDays
              className={cn(
                "size-4 text-[#9ca3af] transition-opacity",
                hasValue ? "group-hover:opacity-0" : "opacity-100"
              )}
            />
            {hasValue ? (
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full bg-[#9ca3af] text-white group-hover:flex">
                <X className="size-3" />
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-auto rounded-[6px] border border-[#e6e8ef] !bg-white p-2 text-[14px] text-[#111827] shadow-[0_10px_24px_rgba(17,24,39,0.18)]"
      >
        <Calendar
          captionLayout="label"
          mode="single"
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          selected={selected ?? undefined}
          onSelect={(date) => {
            if (!date) return
            onChange(toIsoDate(date))
            setOpen(false)
          }}
          className="!bg-white text-[14px] [&_.rdp-caption_label]:text-[14px] [&_.rdp-day]:text-[14px] [&_.rdp-day_button]:h-9 [&_.rdp-day_button]:w-9 [&_.rdp-day_button]:text-[14px] [&_.rdp-weekday]:text-[14px] [&_nav>button]:hover:!bg-white"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MonthYearPicker({ value, onChange, useMonthEnd }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseIsoDate(value) ?? new Date(2025, 0, 1)
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const displayValue = toDisplayDate(value)
  const hasValue = Boolean(displayValue)

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setViewYear((parseIsoDate(value) ?? new Date(2025, 0, 1)).getFullYear())
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className={cn(topDateButtonClassName, "group")}>
          <span className={cn(hasValue ? "text-[#111827]" : "text-[#b5bcc9]")}>
            {displayValue || "Select month"}
          </span>
          <span
            role={hasValue ? "button" : undefined}
            tabIndex={hasValue ? 0 : -1}
            aria-label={hasValue ? "Clear selected month" : "Open month picker"}
            className="relative inline-flex size-4 items-center justify-center"
            onPointerDown={(event) => {
              if (!hasValue) return
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              if (!hasValue) return
              event.preventDefault()
              event.stopPropagation()
              onChange("")
              setOpen(false)
            }}
            onKeyDown={(event) => {
              if (!hasValue) return
              if (event.key !== "Enter" && event.key !== " ") return
              event.preventDefault()
              event.stopPropagation()
              onChange("")
              setOpen(false)
            }}
          >
            <CalendarDays
              className={cn(
                "size-4 text-[#9ca3af] transition-opacity",
                hasValue ? "group-hover:opacity-0" : "opacity-100"
              )}
            />
            {hasValue ? (
              <span className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full bg-[#9ca3af] text-white group-hover:flex">
                <X className="size-3" />
              </span>
            ) : null}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-[300px] rounded-[6px] bg-white p-0 shadow-[0_10px_24px_rgba(17,24,39,0.18)]"
      >
        <div className="flex h-[50px] items-center justify-between px-3">
          <button
            type="button"
            className="inline-flex size-6 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#6b7280]"
            onClick={() => setViewYear((y) => y - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-[16px] font-medium text-[#111827]">{viewYear}</span>
          <button
            type="button"
            className="inline-flex size-6 cursor-pointer items-center justify-center text-[#9ca3af] hover:text-[#6b7280]"
            onClick={() => setViewYear((y) => y + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-y-5 px-4 pb-5 pt-3">
          {monthLabels.map((label, i) => {
            const isSelected =
              selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === i
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const next = useMonthEnd
                    ? new Date(viewYear, i + 1, 0)
                    : new Date(viewYear, i, 1)
                  onChange(toIsoDate(next))
                  setOpen(false)
                }}
                className={
                  isSelected
                    ? "mx-auto h-[30px] min-w-[64px] cursor-pointer rounded-[4px] bg-[#2563eb] px-3 text-[12px] font-medium text-white"
                    : "mx-auto h-[30px] min-w-[64px] cursor-pointer rounded-[4px] px-3 text-[12px] font-medium text-[#111827] hover:bg-[#f3f4f8]"
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function FiscalYearForm() {
  const { control, watch, setValue, getValues, trigger } = useFormContext<SettingsFormValues>()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "fiscalYear.holidays",
  })

  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
  const [editingHolidayIndex, setEditingHolidayIndex] = useState<number | null>(null)
  const [holidayDraft, setHolidayDraft] = useState<HolidayDraft>({
    date: "",
    holiday: "",
    optional: false,
  })

  const fiscalYearStartMonth = watch("fiscalYear.fiscalYearStartMonth")
  const fiscalYearEndMonth = watch("fiscalYear.fiscalYearEndMonth")
  const appliedYearRanges = watch("fiscalYear.appliedYearRanges")
  const selectedYear = watch("fiscalYear.year")

  const parseYearRangeLabel = (value: string): { startYear: number; endYear: number } | null => {
    const m = /^(\d{4})-(\d{4})$/.exec(String(value ?? "").trim())
    if (!m) return null
    const startYear = Number(m[1])
    const endYear = Number(m[2])
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null
    return { startYear, endYear }
  }

  const isIsoDateInRange = (iso: string, startIso: string, endIso: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= startIso && iso <= endIso

  const yearOptions = (() => {
    const startYearNumber = Number(fiscalYearStartMonth?.slice(0, 4))
    const baseYear = Number.isFinite(startYearNumber) ? startYearNumber : 2025
    const base = Array.from({ length: 8 }, (_, i) => {
      const y = baseYear - i
      return `${y}-${y + 1}`
    })
    const uniqueTail = Array.from(
      new Set((appliedYearRanges ?? []).filter((r) => Boolean(r?.trim())))
    )
    const merged = [...base.filter((y) => !uniqueTail.includes(y)), ...uniqueTail]
    if (selectedYear?.trim() && !merged.includes(selectedYear)) return [...merged, selectedYear]
    return merged
  })()

  const applyFiscalYear = () => {
    const start = getValues("fiscalYear.fiscalYearStartMonth")
    const end = getValues("fiscalYear.fiscalYearEndMonth")
    const startDate = parseIsoDate(start)
    const endDate = parseIsoDate(end)
    if (!startDate || !endDate) {
      toast.error(
        "Please select both Fiscal Year start and end months.",
        fiscalYearErrorToastOptions
      )
      return
    }
    const fromStart = `${startDate.getFullYear()}-${endDate.getFullYear()}`

    const current = getValues("fiscalYear.appliedYearRanges") ?? []
    const nextApplied = [...current.filter((x) => x !== fromStart), fromStart]

    setValue("fiscalYear.appliedYearRanges", nextApplied, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setValue("fiscalYear.year", fromStart, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    toast.success("Fiscal Year added successfully", {
      position: "top-center",
      icon: (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
          <Check className="size-3 stroke-[3]" />
        </span>
      ),
      className:
        "!w-fit !max-w-none !min-h-[35px] !rounded-[6px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  }

  const openAddHolidayDialog = () => {
    const defaultDate = fiscalYearEndMonth || fiscalYearStartMonth || "2025-07-01"
    setEditingHolidayIndex(null)
    setHolidayDraft({ date: defaultDate, holiday: "", optional: false })
    setIsHolidayDialogOpen(true)
  }

  const openEditHolidayDialog = (index: number) => {
    const row = getValues(`fiscalYear.holidays.${index}`)
    setEditingHolidayIndex(index)
    setHolidayDraft({
      date: String(row?.date ?? ""),
      holiday: String(row?.holiday ?? ""),
      optional: Boolean(row?.optional),
    })
    setIsHolidayDialogOpen(true)
  }

  const submitHolidayDialog = () => {
    const date = holidayDraft.date.trim()
    const holiday = holidayDraft.holiday.trim()
    const nextRow = {
      date,
      holiday,
      optional: editingHolidayIndex === null ? false : Boolean(holidayDraft.optional),
    }

    // Validate ONLY the modal row (do not block on other existing table rows).
    const rowValidation = fiscalYearHolidaySchema.safeParse(nextRow)
    if (!rowValidation.success) {
      toast.error(rowValidation.error.issues[0]?.message ?? "Please check holiday values.", fiscalYearErrorToastOptions)
      return
    }

    const selectedYear = String(getValues("fiscalYear.year") ?? "").trim()
    const m = /^(\d{4})-(\d{4})$/.exec(selectedYear)
    if (m) {
      const startIso = `${m[1]}-01-01`
      const endIso = `${m[2]}-12-31`
      if (date < startIso || date > endIso) {
        const toDdMmYyyy = (iso: string) => {
          const mm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
          if (!mm) return iso
          return `${mm[3]}-${mm[2]}-${mm[1]}`
        }
        toast.error(
          `Holiday date (${toDdMmYyyy(date)}) must be between fiscal start and end (${toDdMmYyyy(startIso)} and ${toDdMmYyyy(endIso)}).`,
          fiscalYearErrorToastOptions,
        )
        return
      }
    }

    if (editingHolidayIndex === null) {
      append({ date, holiday, optional: false })
      toast.success("Holiday added successfully", {
        position: "top-center",
        icon: (
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
            <Check className="size-3 stroke-[3]" />
          </span>
        ),
        className:
          "!w-fit !max-w-none !min-h-[35px] !rounded-[6px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
      })
    } else {
      update(editingHolidayIndex, {
        date,
        holiday,
        optional: Boolean(holidayDraft.optional),
      })
      toast.success("Holiday updated successfully", {
        position: "top-center",
        icon: (
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
            <Check className="size-3 stroke-[3]" />
          </span>
        ),
        className:
          "!w-fit !max-w-none !min-h-[35px] !rounded-[6px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
      })
    }

    setIsHolidayDialogOpen(false)
  }

  return (
    <div className="bg-transparent px-6 py-3">
      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label className={labelClassName}>FiscalYear Start Month</label>
          <Controller
            name="fiscalYear.fiscalYearStartMonth"
            control={control}
            render={({ field }) => (
              <MonthYearPicker value={field.value} onChange={field.onChange} useMonthEnd={false} />
            )}
          />
        </div>

        <div>
          <label className={labelClassName}>FiscalYear End Month</label>
          <Controller
            name="fiscalYear.fiscalYearEndMonth"
            control={control}
            render={({ field }) => (
              <MonthYearPicker value={field.value} onChange={field.onChange} useMonthEnd={true} />
            )}
          />
        </div>

        <Button
          type="button"
          onClick={applyFiscalYear}
          className="mb-2 h-[30px] min-w-[150px] shrink-0 cursor-pointer rounded-[6px] bg-[var(--primary)] px-3 text-[12px] font-medium text-white hover:bg-[var(--primary)]"
        >
          Add/Edit Fiscal Year
        </Button>
      </div>

      <div className="mt-3 flex w-full items-end gap-3">
        <div className="w-fit shrink-0">
          <label className={labelClassName}>Year</label>
          <Controller
            name="fiscalYear.year"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? ""}
                onChange={(value) => {
                  field.onChange(value)
                  const years = parseYearRangeLabel(value)
                  if (!years) return
                  const startIso = `${years.startYear}-01-01`
                  const endIso = `${years.endYear}-12-31`

                  setValue("fiscalYear.fiscalYearStartMonth", startIso, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                  setValue("fiscalYear.fiscalYearEndMonth", endIso, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })

                  const current = getValues("fiscalYear.holidays") ?? []
                  const filtered = current.filter((row) =>
                    isIsoDateInRange(String(row?.date ?? ""), startIso, endIso),
                  )
                  setValue("fiscalYear.holidays", filtered, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })

                  void trigger("fiscalYear")
                }}
                onBlur={field.onBlur}
                options={yearOptions.map((option) => ({ value: option, label: option }))}
                placeholder="Select year"
                className="!h-[46px] !min-h-[46px] w-fit min-w-[112px] max-w-[112px] shrink-0 !rounded-[6px] !border-[#d6d7dc] !pl-2.5 !pr-9 !text-center !text-[14px] focus-visible:!border-[#6C5DD3] focus-visible:!ring-0"
                itemButtonClassName="rounded-[6px] px-3 py-2 text-center"
                itemLabelClassName="!text-[14px] text-center"
              />
            )}
          />
        </div>

        <Button
          type="button"
          onClick={openAddHolidayDialog}
          className="ml-auto h-[38px] shrink-0 cursor-pointer gap-1.5 rounded-[8px] bg-[var(--primary)] px-3 text-[12px] font-medium text-white hover:bg-[var(--primary)]"
        >
          <Plus className="size-3.5" />
          Add Holiday
        </Button>
      </div>

      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent
          showClose={false}
          className="top-[26%] max-w-[560px] rounded-[6px] border border-[#e6e8ef] bg-white p-6 text-[14px] sm:top-[22%]"
          overlayClassName="bg-black/30"
        >
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-center !text-[14px] font-semibold leading-normal tracking-normal text-[#111827]">
              {editingHolidayIndex === null ? "Add Holiday" : "Edit Holiday"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-6 grid grid-cols-2 gap-8 text-[14px]">
            <div className="space-y-2">
              <label className="mb-2 block text-[14px] font-normal text-[#2a2f3a]">Date</label>
              <HolidayDatePicker
                value={holidayDraft.date}
                onChange={(next) => setHolidayDraft((p) => ({ ...p, date: next }))}
              />
            </div>
            <div className="space-y-2">
              <label className="mb-2 block text-[14px] font-normal text-[#2a2f3a]">Holiday</label>
              <Input
                value={holidayDraft.holiday}
                onChange={(e) => setHolidayDraft((p) => ({ ...p, holiday: e.target.value }))}
                placeholder="Enter Holiday"
                className="h-[40px] rounded-[6px] border border-[#d6d7dc] bg-white px-3 !text-[14px] text-[#111827] shadow-none placeholder:text-[14px] placeholder:text-[#b5bcc9] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
              />
            </div>
          </div>

          {editingHolidayIndex !== null ? (
            <div className="mt-5 flex items-center gap-2 text-[14px] text-[#2a2f3a]">
              <input
                id="holiday-enable-disable"
                type="checkbox"
                checked={holidayDraft.optional}
                onChange={(e) =>
                  setHolidayDraft((p) => ({ ...p, optional: e.target.checked }))
                }
                className="size-4 shrink-0 cursor-pointer rounded border border-[#d6d7dc] accent-[var(--primary)]"
              />
              <label htmlFor="holiday-enable-disable" className="cursor-pointer font-normal select-none">
                Enable/Disable
              </label>
            </div>
          ) : null}

          <DialogFooter className="mt-6 flex justify-end gap-3 sm:justify-end">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="h-[44px] min-w-[94px] rounded-[6px] border-0 bg-[#d9d9d9] px-5 !text-[14px] font-medium text-[#111827] hover:bg-[#d9d9d9]"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={submitHolidayDialog}
              className="h-[44px] min-w-[70px] rounded-[6px] bg-[var(--primary)] px-6 !text-[14px] font-medium text-white hover:bg-[var(--primary)]"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FiscalYearTable
        control={control}
        fields={fields}
        onEditRow={openEditHolidayDialog}
        onRemoveRow={remove}
      />

    </div>
  )
}


