"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, parseISO, isWithinInterval } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getWeeksForQuarter } from "../utils/weeks"

interface ReportWeekCalendarPickerProps {
  value?: string // "startDate|endDate"
  onChange: (value: string) => void
  fiscalYear: string
  quarter: string
  className?: string
}

export function ReportWeekCalendarPicker({
  value,
  onChange,
  fiscalYear,
  quarter,
  className,
}: ReportWeekCalendarPickerProps) {
  const [open, setOpen] = React.useState(false)

  // Generate valid bi-weeks for the selected quarter
  const biWeeks = React.useMemo(() => {
    return getWeeksForQuarter(fiscalYear, quarter)
  }, [fiscalYear, quarter])

  // Parse current value into a date range for the calendar highlight
  const selectedRange = React.useMemo(() => {
    if (!value) return undefined
    const parts = value.split("|")
    if (parts.length !== 2) return undefined
    const [start, end] = parts
    return {
      from: parseISO(start),
      to: parseISO(end),
    }
  }, [value])

  // Find which bi-week a clicked date belongs to
  const handleSelect = (date: Date | undefined) => {
    if (!date) return

    const found = biWeeks.find((bw) => {
      const parts = bw.value.split("|")
      if (parts.length !== 2) return false
      const [start, end] = parts
      return isWithinInterval(date, {
        start: parseISO(start),
        end: parseISO(end),
      })
    })

    if (found) {
      onChange(found.value)
      setOpen(false)
    }
  }

  // Display label for the trigger button
  const displayLabel = React.useMemo(() => {
    if (!value) return "Select Week"
    const found = biWeeks.find((bw) => bw.value === value)
    return found?.label ?? "Select Week"
  }, [value, biWeeks])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={"outline"}
          type="button"
          className={cn(
            "relative flex min-h-[48px] w-full items-center justify-between rounded-[8px] border border-[#d6d7dc] bg-white px-3 py-1.5 text-left text-[14px] font-normal shadow-none hover:bg-white",
            !value && "text-[#9ca3af]",
            className
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <CalendarIcon className="size-4 text-[#6b7280]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="z-[100] w-auto p-0 bg-white"
        sideOffset={6}
      >
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={() => {}}
          onDayClick={handleSelect}
          numberOfMonths={2}
          showWeekNumber
          defaultMonth={selectedRange?.from}
          className="rounded-md border shadow"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
