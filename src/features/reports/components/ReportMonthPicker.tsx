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

const YEAR_START = 1990
const YEAR_END = 2040
const YEARS = Array.from(
  { length: YEAR_END - YEAR_START + 1 },
  (_, index) => YEAR_END - index,
)

type PickerPanel = "month" | "year"

type ReportMonthPickerProps = {
  id?: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
}

function parseMonthValue(value: string): { year: number; month: number } | null {
  if (!value?.trim()) return null
  const [yearPart, monthPart] = value.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null
  }
  return { year, month: month - 1 }
}

function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

function formatMonthDisplay(value: string): string {
  const parsed = parseMonthValue(value)
  if (!parsed) return ""
  return new Date(parsed.year, parsed.month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

/** Keep focus inside the popover so year nav does not dismiss it. */
function keepPopoverOpen(event: PointerEvent | MouseEvent) {
  event.preventDefault()
}

export function ReportMonthPicker({ id, value, onChange, onBlur, className }: ReportMonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<PickerPanel>("month")
  const parsed = parseMonthValue(value ?? "")
  const now = new Date()
  const [viewYear, setViewYear] = useState(parsed?.year ?? now.getFullYear())
  const displayValue = formatMonthDisplay(value ?? "")
  const yearListRef = useRef<HTMLDivElement>(null)

  const resetPickerState = () => {
    setPanel("month")
    setViewYear(parsed?.year ?? now.getFullYear())
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) {
      resetPickerState()
    } else {
      setPanel("month")
      onBlur?.()
    }
  }

  const handleSelectMonth = (monthIndex: number) => {
    onChange(formatMonthValue(viewYear, monthIndex))
    setOpen(false)
    setPanel("month")
    onBlur?.()
  }

  const handleSelectYear = (year: number) => {
    setViewYear(year)
    setPanel("month")
  }

  const openYearPanel = () => {
    setPanel("year")
    requestAnimationFrame(() => {
      yearListRef.current
        ?.querySelector(`[data-year="${viewYear}"]`)
        ?.scrollIntoView({ block: "center" })
    })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          className={cn(
            "box-border flex h-12 w-full min-w-[112px] max-w-[168px] cursor-pointer items-center justify-between rounded-[8px] border border-[#d6d7dc] bg-white px-[9.29688px] text-left text-[14px] font-normal text-[#111827] shadow-none outline-none hover:bg-white focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD3]/25 data-[state=open]:border-[#6C5DD3] data-[state=open]:ring-1 data-[state=open]:ring-[#6C5DD3]/25",
            className,
          )}
        >
          <span className={cn("truncate", displayValue ? "text-[#111827]" : "text-[#9ca3af]")}>
            {displayValue || "Select month"}
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
        {panel === "month" ? (
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
              <button
                type="button"
                onPointerDown={keepPopoverOpen}
                onClick={openYearPanel}
                className="mt-1.5 w-full cursor-pointer text-center text-[12px] font-medium text-[#6C5DD3] hover:text-[#5b4fc2]"
              >
                Jump to year
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 p-4">
              {MONTH_LABELS.map((label, monthIndex) => {
                const isSelected = parsed?.year === viewYear && parsed?.month === monthIndex
                return (
                  <button
                    key={label}
                    type="button"
                    onPointerDown={keepPopoverOpen}
                    onClick={() => handleSelectMonth(monthIndex)}
                    className={cn(
                      "h-[40px] cursor-pointer rounded-[6px] px-1 text-[14px] font-medium transition-colors",
                      isSelected
                        ? "bg-[#6C5DD3] text-white"
                        : "text-[#111827] hover:bg-[#ede9fe]",
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center justify-between border-t border-[#e5e7eb] px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                  onBlur?.()
                }}
                className="cursor-pointer text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(formatMonthValue(now.getFullYear(), now.getMonth()))
                  setOpen(false)
                  onBlur?.()
                }}
                className="cursor-pointer text-[14px] font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                This month
              </button>
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
              Tap a year, then choose a month
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
