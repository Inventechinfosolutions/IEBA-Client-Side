import { useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { CalendarDays, Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
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
import { useSettingsFiscalYearUi } from "@/features/settings/hooks/useSettingsFiscalYearUi"
import { useFiscalYearYearOptions } from "@/features/settings/hooks/useFiscalYearYearOptions"
import { useAddHoliday } from "@/features/settings/mutations/addHoliday"
import { useDeleteHoliday } from "@/features/settings/mutations/deleteHoliday"
import { useUpdateHoliday } from "@/features/settings/mutations/updateHoliday"
import { useUpsertFiscalYear } from "@/features/settings/mutations/upsertFiscalYear"
import { useListHolidaysByDateRange } from "@/features/settings/queries/listHolidaysByDateRange"
import type { SettingsFormValues } from "@/features/settings/types"
import { FiscalYearTable } from "./FiscalYearTable"
import type { HolidayDraft, HolidayDatePickerProps, MonthYearPickerProps, SettingsHolidayCalendarRow } from "./types"
import { monthLabels } from "./types"
import { FISCAL_YEAR_ERROR_TOAST_OPTIONS, FISCAL_YEAR_SUCCESS_TOAST_CLASSNAME } from "./fiscalYear.constants"
import { fiscalYearHolidaySchema, fiscalYearUpsertFormSchema } from "./schema"
import {
  isoYmdToDisplayDdMmYyyy,
  isoYmdToHolidayListStartEnd,
  normalizeFiscalDateToIso,
  parseFiscalYearRangeLabel,
  parseIsoYmdToLocalDate,
  toIsoYmdFromDate,
  isIsoYmdInRange,
} from "./fiscalYearDateUtils"
import { cn } from "@/lib/utils"

const labelClassName =
  "mb-2 block text-[12px] font-normal text-[var(--primary)]"

const topDateButtonClassName =
  "h-[40px] w-[150px] justify-between rounded-[6px] border border-[#d6d7dc] !bg-white px-3 text-[12px] font-normal text-[#111827] hover:!bg-white focus-visible:!bg-white data-[state=open]:!bg-white"

const showFiscalYearSuccessToast = (message: string) =>
  toast.success(message, {
    position: "top-center",
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    ),
    className: FISCAL_YEAR_SUCCESS_TOAST_CLASSNAME,
  })

function HolidayDatePicker({
  value,
  onChange,
}: HolidayDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIsoYmdToLocalDate(value)
  const hasValue = Boolean(value)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => selected ?? new Date())

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setCalendarMonth(parseIsoYmdToLocalDate(value) ?? new Date())
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
            {isoYmdToDisplayDdMmYyyy(value) || "DD-MM-YYYY"}
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
            onChange(toIsoYmdFromDate(date))
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
  const selectedDate = parseIsoYmdToLocalDate(value) ?? new Date(2025, 0, 1)
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())
  const displayValue = isoYmdToDisplayDdMmYyyy(value)
  const hasValue = Boolean(displayValue)

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setViewYear((parseIsoYmdToLocalDate(value) ?? new Date(2025, 0, 1)).getFullYear())
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
                  onChange(toIsoYmdFromDate(next))
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
  const { fiscalYears, setSelectedFiscalYearId, isFiscalYearsPending } = useSettingsFiscalYearUi()

  const upsertFiscalYearMutation = useUpsertFiscalYear()
  const addHolidayMutation = useAddHoliday()
  const updateHolidayMutation = useUpdateHoliday()
  const deleteHolidayMutation = useDeleteHoliday()

  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false)
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null)
  const [holidayDraft, setHolidayDraft] = useState<HolidayDraft>({
    date: "",
    holiday: "",
    optional: false,
  })

  const fiscalYearStartMonth = watch("fiscalYear.fiscalYearStartMonth")
  const fiscalYearEndMonth = watch("fiscalYear.fiscalYearEndMonth")
  const appliedYearRanges = watch("fiscalYear.appliedYearRanges")
  const selectedYear = watch("fiscalYear.year")

  const rangeParams = isoYmdToHolidayListStartEnd(
    String(fiscalYearStartMonth ?? "").trim(),
    String(fiscalYearEndMonth ?? "").trim(),
  )

  const holidaysQuery = useListHolidaysByDateRange({
    startmonth: rangeParams?.startmonth ?? "",
    endmonth: rangeParams?.endmonth ?? "",
    enabled: Boolean(
      rangeParams &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(fiscalYearStartMonth ?? "").trim()) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(fiscalYearEndMonth ?? "").trim()) &&
        String(fiscalYearStartMonth ?? "").trim() <= String(fiscalYearEndMonth ?? "").trim(),
    ),
  })

  const holidays: readonly SettingsHolidayCalendarRow[] = holidaysQuery.data ?? []

  const yearOptions = useFiscalYearYearOptions(fiscalYears, appliedYearRanges, selectedYear)

  const handleSaveFiscalYearRange = () => {
    const start = getValues("fiscalYear.fiscalYearStartMonth")
    const end = getValues("fiscalYear.fiscalYearEndMonth")
    const parsed = fiscalYearUpsertFormSchema.safeParse({ fiscalYearStartMonth: start, fiscalYearEndMonth: end })
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Please check fiscal year dates.",
        FISCAL_YEAR_ERROR_TOAST_OPTIONS,
      )
      return
    }

    const startDate = parseIsoYmdToLocalDate(parsed.data.fiscalYearStartMonth)
    const endDate = parseIsoYmdToLocalDate(parsed.data.fiscalYearEndMonth)
    if (!startDate || !endDate) {
      toast.error("Please select both Fiscal Year start and end months.", FISCAL_YEAR_ERROR_TOAST_OPTIONS)
      return
    }

    const id = `${startDate.getFullYear()}-${endDate.getFullYear()}`
    const startApi = toIsoYmdFromDate(startDate)
    const endApi = toIsoYmdFromDate(endDate)

    upsertFiscalYearMutation.mutate(
      { id, start: startApi, end: endApi },
      {
        onSuccess: () => {
          const fromStart = id
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
          setSelectedFiscalYearId(fromStart)
          showFiscalYearSuccessToast("Fiscal Year saved successfully")
        },
        onError: (err) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to save fiscal year",
            FISCAL_YEAR_ERROR_TOAST_OPTIONS,
          )
        },
      },
    )
  }

  const handleOpenCreateHolidayDialog = () => {
    const defaultDate = fiscalYearEndMonth || fiscalYearStartMonth || ""
    setEditingHolidayId(null)
    setHolidayDraft({ date: defaultDate, holiday: "", optional: false })
    setIsHolidayDialogOpen(true)
  }

  const handleOpenEditHolidayDialog = (row: SettingsHolidayCalendarRow) => {
    setEditingHolidayId(row.id)
    setHolidayDraft({
      date: row.dateIso,
      holiday: row.description,
      optional: Boolean(row.optional),
    })
    setIsHolidayDialogOpen(true)
  }

  const handleSubmitHolidayDialog = () => {
    const date = holidayDraft.date.trim()
    const description = holidayDraft.holiday.trim()
    const rowValidation = fiscalYearHolidaySchema.safeParse({
      date,
      holiday: description,
      optional: editingHolidayId === null ? false : Boolean(holidayDraft.optional),
    })
    if (!rowValidation.success) {
      toast.error(
        rowValidation.error.issues[0]?.message ?? "Please check holiday values.",
        FISCAL_YEAR_ERROR_TOAST_OPTIONS,
      )
      return
    }

    const startIso = String(getValues("fiscalYear.fiscalYearStartMonth") ?? "").trim()
    const endIso = String(getValues("fiscalYear.fiscalYearEndMonth") ?? "").trim()
    if (!isIsoYmdInRange(date, startIso, endIso)) {
      toast.error(
        "Holiday date must fall within the selected fiscal year start and end.",
        FISCAL_YEAR_ERROR_TOAST_OPTIONS,
      )
      return
    }

    if (editingHolidayId === null) {
      addHolidayMutation.mutate(
        { date, description, optional: false },
        {
          onSuccess: () => {
            showFiscalYearSuccessToast("Holiday added successfully")
            setIsHolidayDialogOpen(false)
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Failed to add holiday", FISCAL_YEAR_ERROR_TOAST_OPTIONS)
          },
        },
      )
    } else {
      updateHolidayMutation.mutate(
        {
          id: editingHolidayId,
          date,
          description,
          optional: Boolean(holidayDraft.optional),
        },
        {
          onSuccess: () => {
            showFiscalYearSuccessToast("Holiday updated successfully")
            setIsHolidayDialogOpen(false)
          },
          onError: (err) => {
            toast.error(
              err instanceof Error ? err.message : "Failed to update holiday",
              FISCAL_YEAR_ERROR_TOAST_OPTIONS,
            )
          },
        },
      )
    }
  }

  const handleDeleteHoliday = (holidayId: number) => {
    deleteHolidayMutation.mutate(holidayId, {
      onSuccess: () => showFiscalYearSuccessToast("Holiday deleted"),
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete holiday", FISCAL_YEAR_ERROR_TOAST_OPTIONS)
      },
    })
  }

  if (isFiscalYearsPending && fiscalYears.length === 0) {
    return (
      <div className="bg-transparent px-6 py-3 text-[12px] text-[#6b7280]">Loading fiscal years…</div>
    )
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
          onClick={handleSaveFiscalYearRange}
          disabled={upsertFiscalYearMutation.isPending}
          className="mb-2 h-[30px] min-w-[150px] shrink-0 cursor-pointer rounded-[6px] bg-[var(--primary)] px-3 text-[12px] font-medium text-white hover:bg-[var(--primary)] disabled:opacity-60"
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
                  setSelectedFiscalYearId(value)
                  const row = fiscalYears.find((fy) => fy.id === value)
                  if (row?.start && row?.end) {
                    const s = normalizeFiscalDateToIso(row.start)
                    const e = normalizeFiscalDateToIso(row.end)
                    setValue("fiscalYear.fiscalYearStartMonth", s, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                    setValue("fiscalYear.fiscalYearEndMonth", e, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true,
                    })
                  } else {
                    const years = parseFiscalYearRangeLabel(value)
                    if (years) {
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
                    }
                  }
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
          onClick={handleOpenCreateHolidayDialog}
          disabled={addHolidayMutation.isPending || !rangeParams}
          className="ml-auto h-[38px] shrink-0 cursor-pointer gap-1.5 rounded-[8px] bg-[var(--primary)] px-3 text-[12px] font-medium text-white hover:bg-[var(--primary)] disabled:opacity-60"
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
              {editingHolidayId === null ? "Add Holiday" : "Edit Holiday"}
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
              <TitleCaseInput
                value={holidayDraft.holiday}
                onChange={(e) => setHolidayDraft((p) => ({ ...p, holiday: e.target.value }))}
                placeholder="Enter Holiday"
                className="h-[40px] rounded-[6px] border border-[#d6d7dc] bg-white px-3 !text-[14px] text-[#111827] shadow-none placeholder:text-[14px] placeholder:text-[#b5bcc9] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
              />
            </div>
          </div>

          {editingHolidayId !== null ? (
            <div className="mt-5 flex items-center gap-2 text-[14px] text-[#2a2f3a]">
              <TitleCaseInput
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
              onClick={handleSubmitHolidayDialog}
              disabled={addHolidayMutation.isPending || updateHolidayMutation.isPending}
              className="h-[44px] min-w-[70px] rounded-[6px] bg-[var(--primary)] px-6 !text-[14px] font-medium text-white hover:bg-[var(--primary)] disabled:opacity-60"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FiscalYearTable
        holidays={holidays}
        isLoading={holidaysQuery.isPending}
        onEditRow={handleOpenEditHolidayDialog}
        onRemoveRow={handleDeleteHoliday}
      />
    </div>
  )
}
