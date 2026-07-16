import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { toIsoYmdFromDate } from "@/lib/dates"
import "./index.styles.css"

type SelectionMode = 'day' | 'week';

const DateStatus = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUBMITTED: 'submitted',
  SUBMITTED_LESS: 'submittedless',
  SUBMITTED_EXCEED: 'submittedexceed',
  NOT_SUBMITTED: 'notsubmitted',
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend',
  APPROVED_TIME_ENTRY: 'approved_time_entry',
  LESS_HOURS: 'less_hours',
  MORE_HOURS: 'more_hours',
} as const

type DateStatus = (typeof DateStatus)[keyof typeof DateStatus]

/** Per-week totals from time submission APIs. Key = UTC week start `YYYY-MM-DD` (first day of that grid row, UTC). */
export type CalendarWeekSummary = {
  totalMinutes: number
  status: DateStatus
}

export type AppCalenderProps = Omit<ComponentProps<"div">, "children"> & {
  /** When false, hides the bottom “Time Entry Status” legend (e.g. dashboard uses a separate legend card). */
  showBuiltInLegend?: boolean
  /** Total minutes submitted for the week + rolled-up week status. When omitted, weeks show 0 and a neutral status dot. */
  weekSummaries?: Record<string, CalendarWeekSummary>
  /** Controlled selected date. */
  selectedDate?: Date | null
  /** Callback when a date is clicked or chosen (arrow move, Enter, click). */
  onDateSelect?: (date: Date) => void
  /**
   * Fired when the user activates a day for editing (click / Enter / Space),
   * not when only moving the highlight with arrow keys.
   * Use to move focus into the time-entry form (e.g. Program).
   */
  onDayActivate?: (date: Date) => void
  /** Controlled month/year viewport. */
  currentMonthDate?: Date
  /** Callback when month/year navigation occurs. */
  onMonthChange?: (date: Date) => void
  /** Status overrides for individual days (mapped by YYYY-MM-DD). */
  dayStatuses?: Record<string, { status: DateStatus; color?: string; hasNotes?: boolean; noteText?: string }>
  /** If true, renders an additional ACTION column at the end of the calendar grid. */
  showActionColumn?: boolean
  /** Render function for the STATUS column to override default dot. */
  renderStatus?: (weekIndex: number, dates: Date[], status: DateStatus) => React.ReactNode
  /** Render function for the ACTION column. Receives week index, dates, and week status. */
  renderAction?: (weekIndex: number, dates: Date[], status: DateStatus) => React.ReactNode
  /**
   * When Tab is pressed on a focused day cell, call this instead of walking every day
   * and mid-page controls. Typical use: move focus to the first form field (e.g. Program).
   * Shift+Tab is left to the browser (month nav / previous controls).
   */
  onDayTabOut?: () => void
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isWeekSelected: boolean;
  status: DateStatus;
  color?: string;
  hasNotes?: boolean;
  noteText?: string;
  weekDay: string;
}


const weekSummaryDotColors: Record<DateStatus, string> = {
  [DateStatus.APPROVED_TIME_ENTRY]: '#6C757D',
  [DateStatus.LESS_HOURS]: '#FFC107',
  [DateStatus.MORE_HOURS]: '#DC3545',
  [DateStatus.SUBMITTED]: '#28A745',
  [DateStatus.SUBMITTED_LESS]: '#FFC107',
  [DateStatus.SUBMITTED_EXCEED]: '#DC3545',
  [DateStatus.APPROVED]: '#28A745',
  [DateStatus.REJECTED]: '#DC3545',
  [DateStatus.NOT_SUBMITTED]: '#f3f4f6',
  [DateStatus.LEAVE]: '#93c5fd',
  [DateStatus.HOLIDAY]: '#fde68a',
  [DateStatus.WEEKEND]: '#f1f5f9',
};;

/** Locale used by AppCalender — week row keys must match this when rolling up summaries. */
export const CALENDAR_LOCALE = "en-GB"

/**
 * First day of each calendar week row (`Date.getDay()` index: 0=Sun … 6=Sat).
 * Product weeks are Mon–Sun. Do not use `DateTimeFormat.resolvedOptions().weekday`
 * — that option is a format style ("short"/"long"), not the week-start weekday.
 */
export const CALENDAR_FIRST_DAY_OF_WEEK = 1 // Monday

/** Monday (=1) … offset within the Mon–Sun week row for a JS weekday (0=Sun … 6=Sat). */
export function getOffsetWithinCalendarWeek(jsWeekday: number): number {
  let offset = jsWeekday - CALENDAR_FIRST_DAY_OF_WEEK
  if (offset < 0) offset += 7
  return offset
}

/** Local Monday that starts the calendar week containing `date`. */
export function getCalendarWeekStartDate(date: Date): Date {
  const offset = getOffsetWithinCalendarWeek(date.getDay())
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

/** Build lookup key for `weekSummaries` from the first day of a calendar row. */
export function formatWeekStartUtcKey(date: Date): string {
  return toIsoYmdFromDate(date)
}

/** Week-start key for a YYYY-MM-DD date, aligned with AppCalender grid rows (Mon–Sun). */
export function getCalendarWeekStartKeyFromIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return toIsoYmdFromDate(getCalendarWeekStartDate(date))
}

function getNowInTimezone(_timezone: string, _locale: string) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfCalendarGrid(date: Date, _timezone: string, _locale: string) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstOfMonth = new Date(year, month, 1);

  const startOffset = getOffsetWithinCalendarWeek(firstOfMonth.getDay());
  return new Date(year, month, 1 - startOffset);
}

const AppCalender = ({
  showBuiltInLegend = true,
  weekSummaries,
  selectedDate: propsSelectedDate,
  onDateSelect,
  onDayActivate,
  currentMonthDate: propsCurrentMonthDate,
  onMonthChange,
  dayStatuses,
  showActionColumn,
  renderStatus,
  renderAction,
  onDayTabOut,
  className,
  ...divProps
}: AppCalenderProps) => {
  const [selectedTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [locale] = useState("en-GB")
  const [selectionMode] = useState<SelectionMode>("day")
  const [internalCurrentDate, setInternalCurrentDate] = useState(() => getNowInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone, "en-GB"));
  const currentDate = propsCurrentMonthDate ?? internalCurrentDate;

  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(null);
  const selectedDate = propsSelectedDate !== undefined ? propsSelectedDate : internalSelectedDate;

  const [selectedWeekDates, setSelectedWeekDates] = useState<Date[]>([]);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleString(locale, { month: 'long' })
  );
  const years = Array.from({ length: 21 }, (_, i) => {
    const date = new Date();
    const parts = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      timeZone: selectedTimezone
    }).formatToParts(date);
    const currentYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    return currentYear - 10 + i;
  });

  // Short weekday labels Sun→Sat, then rotate so Mon is first (CALENDAR_FIRST_DAY_OF_WEEK).
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2021, 0, 3 + i); // Start with a Sunday
    return date.toLocaleString(locale, { weekday: 'short' });
  });

  const rotatedDays = [
    ...daysOfWeek.slice(CALENDAR_FIRST_DAY_OF_WEEK),
    ...daysOfWeek.slice(0, CALENDAR_FIRST_DAY_OF_WEEK),
  ];

  const getDateInfo = useCallback((date: Date): { status: DateStatus; color?: string; hasNotes?: boolean; noteText?: string } => {
    if (dayStatuses) {
      const key = toIsoYmdFromDate(date)
      const info = dayStatuses[key]
      if (info) {
        return {
          status: info.status,
          color: info.color,
          hasNotes: info.hasNotes,
          noteText: info.noteText
        }
      }
    }
    return { status: DateStatus.NOT_SUBMITTED };
  }, [dayStatuses]);

  const calendarWeeks = useMemo(() => {
    const startDate = getStartOfCalendarGrid(currentDate, selectedTimezone, locale);
    const weeks: CalendarDay[][] = [];
    const today = getNowInTimezone(selectedTimezone, locale);

    let currentWeek: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);

      const isSelected = selectionMode === 'day' && selectedDate
        ? date.getTime() === selectedDate.getTime()
        : false;

      const isWeekSelected = selectionMode === 'week'
        ? selectedWeekDates.some(d => d.getTime() === date.getTime())
        : false;

      const isToday = date.getTime() === today.getTime();

      currentWeek.push({
        date,
        day: date.getDate(),
        weekDay: rotatedDays[getOffsetWithinCalendarWeek(date.getDay())],
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isSelected,
        isToday,
        isWeekSelected,
        ...getDateInfo(date)
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    return weeks.filter(week => week.some(day => day.isCurrentMonth));
  }, [currentDate, selectedDate, selectedWeekDates, selectedTimezone, selectionMode, getDateInfo, locale, rotatedDays]);

  const flatDays = useMemo(() => calendarWeeks.flat(), [calendarWeeks])

  const focusDayByIndex = useCallback((index: number) => {
    const day = flatDays[index]
    if (!day) return
    const key = toIsoYmdFromDate(day.date)
    const el = document.querySelector(
      `[data-calendar-day="${key}"]`,
    ) as HTMLElement | null
    el?.focus()
  }, [flatDays])

  const handleDayClick = (
    date: Date,
    source: "pointer" | "keyboard-activate" | "keyboard-move" = "pointer",
  ) => {
    // Auto-navigate if clicking a day from a different month
    if (date.getMonth() !== currentDate.getMonth()) {
      handleMonthChange(new Date(date.getFullYear(), date.getMonth(), 1))
    }

    if (selectionMode === 'day') {
      if (onDateSelect) {
        onDateSelect(date);
      } else {
        setInternalSelectedDate(date);
      }
      setSelectedWeekDates([]);
      if (source !== "keyboard-move") {
        onDayActivate?.(date)
      }
    } else {
      const weekStart = getCalendarWeekStartDate(date);

      const week = Array.from({ length: 7 }, (_, i) => {
        return new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate() + i
        );
      });
      setSelectedWeekDates(week);
      if (onDateSelect) {
        onDateSelect(null as any);
      } else {
        setInternalSelectedDate(null);
      }
    }
  };

  const handleMonthChange = (newDate: Date) => {
    if (onMonthChange) {
      onMonthChange(newDate);
    } else {
      setInternalCurrentDate(newDate);
    }
  };

  const handleDayKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    dayObj: CalendarDay,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDayClick(dayObj.date, "keyboard-activate")
      return
    }

    if (e.key === "Tab" && !e.shiftKey && onDayTabOut) {
      e.preventDefault()
      onDayTabOut()
      return
    }

    const currentIndex = flatDays.findIndex(
      (d) => d.date.getTime() === dayObj.date.getTime(),
    )
    if (currentIndex < 0) return

    let nextIndex: number | null = null
    if (e.key === "ArrowRight") nextIndex = currentIndex + 1
    else if (e.key === "ArrowLeft") nextIndex = currentIndex - 1
    else if (e.key === "ArrowDown") nextIndex = currentIndex + 7
    else if (e.key === "ArrowUp") nextIndex = currentIndex - 7

    if (nextIndex == null || nextIndex < 0 || nextIndex >= flatDays.length) return

    e.preventDefault()
    const nextDay = flatDays[nextIndex]
    handleDayClick(nextDay.date, "keyboard-move")
    // Focus after selection / possible month change paints
    requestAnimationFrame(() => {
      focusDayByIndex(nextIndex!)
    })
  }

  /** Roving tabindex: one day in the tab order; arrows move within the grid. */
  const tabStopDateKey = useMemo(() => {
    if (selectedDate) return toIsoYmdFromDate(selectedDate)
    const firstCurrent = flatDays.find((d) => d.isCurrentMonth)
    return firstCurrent ? toIsoYmdFromDate(firstCurrent.date) : null
  }, [selectedDate, flatDays])

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col gap-4 bg-background font-sans w-full",
          className
        )}
        {...divProps}
      >
      <div className="ieba-time-study-calendar flex flex-col items-stretch gap-4 w-full">
        <div className="calendar-card w-full">
          {/* Timezone Selector */}
          {/* <div className="mb-4">
            <label htmlFor="timezone-select" className="block text-sm font-medium text-foreground mb-1">
              Select Timezone:
            </label>
            <select
              id="timezone-select"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
            >
              {commonTimezones.map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div> */}

          {/* Selection Mode Selector */}
          {/* <div className="mb-4">
            <label htmlFor="selection-mode" className="block text-sm font-medium text-foreground mb-1">
              Selection Mode:
            </label>
            <select
              id="selection-mode"
              value={selectionMode}
              onChange={(e) => {
                setSelectionMode(e.target.value as SelectionMode);
                setSelectedDate(null);
                setSelectedWeekDates([]);
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring sm:text-sm bg-background text-foreground"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
            </select>
          </div> */}

          <div className="relative">
            {/* Calendar Header */}
            <div className="calendar-header">
              <button
                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                tabIndex={-1}
                className="p-2 rounded-full bg-[#6C5DD3] text-primary-foreground border-none cursor-pointer transition-all duration-200 ease-in-out hover:bg-[#6C5DD3]/90 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:ring-opacity-50"
              >
                ‹
              </button>

              <div className="text-2xl font-semibold text-foreground">
                <Button variant="ghost" tabIndex={-1} onClick={() => setShowMonthSelect(!showMonthSelect)}>
                  {currentDate.toLocaleString(locale, { month: 'long' })}
                </Button>{' '}
                <Button variant="ghost" tabIndex={-1} onClick={() => setShowYearSelect(!showYearSelect)}>
                  {currentDate.toLocaleString(locale, { year: 'numeric' })}
                </Button>
              </div>

              <button
                onClick={() => handleMonthChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                tabIndex={-1}
                className="p-2 rounded-full bg-[#6C5DD3] text-primary-foreground border-none cursor-pointer transition-all duration-200 ease-in-out hover:bg-[#6C5DD3]/90 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:ring-opacity-50"
              >
                ›
              </button>
            </div>

            {showMonthSelect && (
              <div className="absolute top-0 left-0 w-full h-full bg-background z-10 grid grid-cols-3 gap-2 p-4">
                {months.map((month, monthIndex) => (
                  <div
                    key={month}
                    onClick={() => {
                      const year = currentDate.getFullYear();
                      const newDate = new Date(year, monthIndex, 1);
                      handleMonthChange(newDate);
                      setShowMonthSelect(false);
                    }}
                    className="cursor-pointer p-2 text-center hover:bg-accent rounded text-foreground"
                  >
                    {month}
                  </div>
                ))}
              </div>
            )}

            {showYearSelect && (
              <div className="absolute top-0 left-0 w-full h-full bg-background z-10 grid grid-cols-3 gap-2 p-4 overflow-y-auto">
                {years.map(year => (
                  <div
                    key={year}
                    onClick={() => {
                      const month = currentDate.getMonth();
                      const day = currentDate.getDate();
                      const newDate = new Date(year, month, day);
                      handleMonthChange(newDate);
                      setShowYearSelect(false);
                    }}
                    className="cursor-pointer p-2 text-center hover:bg-accent rounded text-foreground"
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}

            {/* Single grid: Mon–Sun + TOTAL(MIN.) + STATUS + optionally ACTION per row */}
            <div className={cn("calendar-weeks-grid", showActionColumn && "has-action")}>
              <div className="days-of-week-container">
                {rotatedDays.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="week-summary-header">TOTAL(MIN.)</div>
              <div className="week-summary-header">STATUS</div>
              {showActionColumn && <div className="week-summary-header">ACTION</div>}

              {calendarWeeks.map((week, weekIndex) => {
                const weekKey = formatWeekStartUtcKey(week[0].date)
                const summary = weekSummaries?.[weekKey]
                const weekTotal = summary?.totalMinutes ?? 0
                const weekStatus = (summary?.status as DateStatus) ?? DateStatus.NOT_SUBMITTED
                return (
                  <Fragment key={`week-${week[0]?.date.getTime() ?? weekIndex}`}>
                    {week.map((dayObj, index) => {
                      const dayKey = toIsoYmdFromDate(dayObj.date)
                      const isTabStop = tabStopDateKey === dayKey
                      const cell = (
                        <div
                          key={`${dayObj.date.getTime()}-${index}`}
                          role="button"
                          data-calendar-day={dayKey}
                          data-calendar-selected-day={dayObj.isSelected ? "true" : undefined}
                          tabIndex={isTabStop ? 0 : -1}
                          onMouseDown={(e) => {
                            // Keep mouse clicks from parking focus on the day cell.
                            // Focus moves to TS Program via onDayActivate (avoids Tab escaping to the sidebar).
                            if (e.button === 0) e.preventDefault()
                          }}
                          onClick={() => handleDayClick(dayObj.date)}
                          onKeyDown={(e) => handleDayKeyDown(e, dayObj)}
                          className={cn(
                            "day-cell text-foreground",
                            !dayObj.isCurrentMonth && "not-current-month",
                            dayObj.isSelected && "selected",
                            dayObj.isWeekSelected && !dayObj.isSelected && "week-selected",
                            dayObj.isToday &&
                              !dayObj.isSelected &&
                              !dayObj.isWeekSelected &&
                              "today",
                            dayObj.isSelected &&
                              "z-1 shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background text-foreground!",
                            dayObj.isWeekSelected &&
                              !dayObj.isSelected &&
                              "border-2 border-primary text-primary! font-medium",
                            dayObj.color && "text-white!"
                          )}
                          style={
                            {
                              backgroundColor: dayObj.color || "#f3f4f6", 
                              backgroundImage: dayObj.status === DateStatus.REJECTED 
                                ? `linear-gradient(to top right, transparent 46%, rgba(0,0,0,0.6) 46%, rgba(0,0,0,0.6) 54%, transparent 54%)`
                                : "none"
                            } as CSSProperties
                          }
                        >
                          {dayObj.day}
                          {dayObj.hasNotes && (
                            <span className="absolute top-1.5 right-1.5 text-[9px] leading-none text-[#6C5DD3] font-black pointer-events-none" style={{ textShadow: '0 0 4px rgba(255,255,255,0.9), 0 1px 3px rgba(108,93,211,0.5)' }}>
                              ★
                            </span>
                          )}
                        </div>
                      );

                      if (dayObj.noteText) {
                        return (
                          <Tooltip key={`${dayObj.date.getTime()}-${index}`}>
                            <TooltipTrigger asChild>{cell}</TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <span className="block break-all break-words">
                                {dayObj.noteText}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return cell;
                    })}
                    <div className="week-summary-total">{weekTotal}</div>
                    <div className="week-summary-status">
                      {renderStatus ? renderStatus(weekIndex, week.map(d => d.date), weekStatus as DateStatus) : (
                        <span
                          className="week-summary-status-dot"
                          style={{
                            backgroundColor: weekSummaryDotColors[weekStatus as DateStatus] || "#94a3b8", 
                          }}
                          title={weekStatus?.replace(/_/g, " ")}
                        />
                      )}
                    </div>
                    {showActionColumn && (
                      <div className="week-summary-action">
                        {renderAction && renderAction(weekIndex, week.map(d => d.date), weekStatus as DateStatus)}
                      </div>
                    )}
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>

      </div>
      {showBuiltInLegend ? (
        <div className="flex items-center justify-center bg-background py-2 w-full">
          <div className="calendar-card w-full max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Time Entry Status
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: "#28A745" }}
                >
                  1
                </div>
                <span className="text-foreground">Submitted (Target Met)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: "#FFC107" }}
                >
                  1
                </div>
                <span className="text-foreground">Less Hours</span>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  style={{ backgroundColor: "#DC3545" }}
                >
                  1
                </div>
                <span className="text-foreground">Exceed Hours</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </TooltipProvider>
  )
}

export default AppCalender
export { AppCalender as TimeStudyCalendar }
