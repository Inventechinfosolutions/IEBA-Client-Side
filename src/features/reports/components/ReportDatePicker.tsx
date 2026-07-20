import { useRef, useState, type MouseEvent, type PointerEvent } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const

const YEAR_START = 1990
const YEAR_END = 2040
const YEARS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, index) => YEAR_END - index,
)

type PickerPanel = "day" | "month" | "year"

type ReportDatePickerProps = {
  id?: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  disabled?: boolean
  placeholder?: string
}

function parseYmdLocal(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return { year, month: month - 1, day }
}

function formatYmdLocal(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatDisplay(value: string): string {
  const parsed = parseYmdLocal(value)
  if (!parsed) return ""
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })
}

function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function shiftMonth(year: number, monthIndex: number, delta: number): { year: number; month: number } {
  const date = new Date(year, monthIndex + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() }
}

/** Keep focus inside the popover so month/year nav does not dismiss it. */
function keepPopoverOpen(event: PointerEvent | MouseEvent) {
  event.preventDefault()
}

export function ReportDatePicker({
  id,
  value,
  onChange,
  onBlur,
  className,
  disabled = false,
  placeholder = "mm/dd/yyyy",
}: ReportDatePickerProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<PickerPanel>("day")
  const parsed = parseYmdLocal(value ?? "")
  const now = new Date()
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? now.getMonth())
  const displayValue = formatDisplay(value ?? "")
  const yearListRef = useRef<HTMLDivElement>(null)

  const resetPickerState = () => {
    setPanel("day")
    setViewYear(parsed?.year ?? now.getFullYear())
    setViewMonth(parsed?.month ?? now.getMonth())
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return
    setOpen(nextOpen)
    if (nextOpen) {
      resetPickerState()
    } else {
      setPanel("day")
      onBlur?.()
    }
  }

  const commitDate = (year: number, monthIndex: number, day: number) => {
    onChange(formatYmdLocal(year, monthIndex, day))
    setOpen(false)
    setPanel("day")
    onBlur?.()
  }

  const clearDate = () => {
    onChange("")
    setOpen(false)
    setPanel("day")
    onBlur?.()
  }

  const openYearPanel = () => {
    setPanel("year")
    requestAnimationFrame(() => {
      yearListRef.current
        ?.querySelector(`[data-year="${viewYear}"]`)
        ?.scrollIntoView({ block: "center" })
    })
  }

  const handleSelectYear = (year: number) => {
    setViewYear(year)
    setPanel("month")
  }

  const handleSelectMonth = (monthIndex: number) => {
    setViewMonth(monthIndex)
    setPanel("day")
  }

  const handlePrevMonth = () => {
    const next = shiftMonth(viewYear, viewMonth, -1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  const handleNextMonth = () => {
    const next = shiftMonth(viewYear, viewMonth, 1)
    setViewYear(next.year)
    setViewMonth(next.month)
  }

  const monthTitle = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const startWeekday = new Date(viewYear, viewMonth, 1).getDay()
  const dayCells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          className={cn(
            "box-border flex h-12 w-full min-w-[112px] max-w-[168px] cursor-pointer items-center justify-between rounded-[8px] border border-[#d6d7dc] bg-white px-[9.29688px] text-left text-[14px] font-normal text-[#111827] shadow-none outline-none hover:bg-white focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3]/25 data-[state=open]:border-[#6C5DD3] data-[state=open]:ring-1 data-[state=open]:ring-[#6C5DD3]/25 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af]",
            className,
          )}
        >
          <span className={cn("truncate", displayValue ? "text-[#111827]" : "text-[#9ca3af]")}>
            {displayValue || placeholder}
          </span>
          <CalendarDays className="size-4 shrink-0 text-[#6b7280]" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="z-[100] w-[360px] overflow-hidden rounded-[10px] border border-[#d6d7dc] bg-white p-0 shadow-[0_12px_28px_rgba(17,24,39,0.16)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {panel === "day" ? (
          <>
            <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-white hover:text-[#111827]"
                  onPointerDown={keepPopoverOpen}
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={() => setPanel("month")}
                  className="h-9 min-w-[88px] flex-1 cursor-pointer rounded-[6px] bg-white px-2 text-center text-[15px] font-semibold text-[#111827] ring-1 ring-[#e5e7eb] hover:ring-[#6C5DD3]"
                  aria-label={`Change month, currently ${monthTitle}`}
                >
                  {monthTitle}
                </button>
                <button
                  type="button"
                  className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-white hover:text-[#111827]"
                  onPointerDown={keepPopoverOpen}
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={() => setPanel("month")}
                  className="cursor-pointer text-center text-[12px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
                >
                  Jump to month
                </button>
                <span className="text-[12px] text-[#d1d5db]" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={openYearPanel}
                  className="cursor-pointer text-center text-[12px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
                >
                  Jump to year
                </button>
              </div>
            </div>
            <div className="px-4 pb-2 pt-3">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="flex h-8 items-center justify-center text-[12px] font-medium text-[#6b7280]"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {dayCells.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="h-9" />
                  }
                  const isSelected =
                    parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day
                  const isToday =
                    now.getFullYear() === viewYear &&
                    now.getMonth() === viewMonth &&
                    now.getDate() === day
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => commitDate(viewYear, viewMonth, day)}
                      className={cn(
                        "h-9 cursor-pointer rounded-[6px] text-[14px] font-medium transition-colors",
                        isSelected
                          ? "bg-[#6C5DD3] text-white"
                          : isToday
                            ? "bg-[#ede9fe] text-[#111827] hover:bg-[#ddd6fe]"
                            : "text-[#111827] hover:bg-[#ede9fe]",
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-3">
              <button
                type="button"
                onClick={clearDate}
                className="cursor-pointer text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => commitDate(now.getFullYear(), now.getMonth(), now.getDate())}
                className="cursor-pointer text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Today
              </button>
            </div>
          </>
        ) : panel === "month" ? (
          <>
            <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-white hover:text-[#111827]"
                  onPointerDown={keepPopoverOpen}
                  onClick={() => setViewYear((year) => Math.max(YEAR_START, year - 1))}
                  aria-label="Previous year"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={openYearPanel}
                  className="h-9 min-w-[88px] flex-1 cursor-pointer rounded-[6px] bg-white px-2 text-center text-[15px] font-semibold text-[#111827] ring-1 ring-[#e5e7eb] hover:ring-[#6C5DD3]"
                  aria-label={`Change year, currently ${viewYear}`}
                >
                  {viewYear}
                </button>
                <button
                  type="button"
                  className="inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[6px] text-[#6b7280] hover:bg-white hover:text-[#111827]"
                  onPointerDown={keepPopoverOpen}
                  onClick={() => setViewYear((year) => Math.min(YEAR_END, year + 1))}
                  aria-label="Next year"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={() => setPanel("day")}
                  className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
                >
                  <ChevronLeft className="size-3.5" />
                  Back to days
                </button>
                <button
                  type="button"
                  onPointerDown={keepPopoverOpen}
                  onClick={openYearPanel}
                  className="cursor-pointer text-[12px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
                >
                  Jump to year
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {MONTH_LABELS.map((label, monthIndex) => {
                const isViewing = viewMonth === monthIndex
                const isCommitted = parsed?.year === viewYear && parsed?.month === monthIndex
                const isCurrentMonth = now.getFullYear() === viewYear && now.getMonth() === monthIndex
                return (
                  <button
                    key={label}
                    type="button"
                    onPointerDown={keepPopoverOpen}
                    onClick={() => handleSelectMonth(monthIndex)}
                    className={cn(
                      "h-[40px] cursor-pointer rounded-[6px] px-1 text-[14px] font-medium transition-colors",
                      isViewing
                        ? "bg-[#6C5DD3] text-white"
                        : isCommitted || isCurrentMonth
                          ? "bg-[#ede9fe] text-[#111827] hover:bg-[#ddd6fe]"
                          : "text-[#111827] hover:bg-[#ede9fe]",
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-[#e5e7eb] px-4 py-3 text-center text-[12px] text-[#6b7280]">
              Tap a month, then choose a date
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
              <button
                type="button"
                onPointerDown={keepPopoverOpen}
                onClick={() => setPanel("month")}
                className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>
              <p className="flex-1 text-center text-[14px] font-semibold text-[#111827]">Select year</p>
              <span className="w-[52px]" aria-hidden />
            </div>
            <div
              ref={yearListRef}
              className="report-month-picker-scroll max-h-[280px] overflow-y-auto px-3 py-3"
            >
              <div className="grid grid-cols-4 gap-2">
                {YEARS.map((year) => {
                  const isSelected = year === viewYear
                  const isCurrentYear = year === now.getFullYear()
                  return (
                    <button
                      key={year}
                      type="button"
                      data-year={year}
                      onPointerDown={keepPopoverOpen}
                      onClick={() => handleSelectYear(year)}
                      className={cn(
                        "h-[38px] cursor-pointer rounded-[6px] text-[14px] font-medium transition-colors",
                        isSelected
                          ? "bg-[#6C5DD3] text-white"
                          : isCurrentYear
                            ? "bg-[#ede9fe] text-[#111827] hover:bg-[#ddd6fe]"
                            : "text-[#111827] hover:bg-[#f3f4f6]",
                      )}
                    >
                      {year}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="border-t border-[#e5e7eb] px-4 py-3 text-center text-[12px] text-[#6b7280]">
              Tap a year, then choose a month and date
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
