import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Fragment,
  useCallback,
  useMemo,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react"

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
  /** Callback when a date is clicked. */
  onDateSelect?: (date: Date) => void
  /** Controlled month/year viewport. */
  currentMonthDate?: Date
  /** Callback when month/year navigation occurs. */
  onMonthChange?: (date: Date) => void
  /** Status overrides for individual days (mapped by YYYY-MM-DD). */
  dayStatuses?: Record<string, { status: DateStatus; color?: string }>
  /** If true, renders an additional ACTION column at the end of the calendar grid. */
  showActionColumn?: boolean
  /** Render function for the STATUS column to override default dot. */
  renderStatus?: (weekIndex: number, dates: Date[], status: DateStatus) => React.ReactNode
  /** Render function for the ACTION column. Receives week index, dates, and week status. */
  renderAction?: (weekIndex: number, dates: Date[], status: DateStatus) => React.ReactNode
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
  weekDay: string;
}

const statusColors: Record<DateStatus, string> = {
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
};

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

/** Build lookup key for `weekSummaries` from the first day of a calendar row (UTC). */
export function formatWeekStartUtcKey(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getNowInTimezone(timezone: string, locale: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: timezone
  }).formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  return new Date(Date.UTC(year, month, day));
}

function getStartOfCalendarGrid(date: Date, timezone: string, locale: string) {
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'numeric', day: 'numeric', timeZone: timezone
  }).formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const firstOfMonth = new Date(Date.UTC(year, month, 1));

  // Get first day of week based on locale
  const firstDayOfWeek = new Intl.DateTimeFormat(locale).resolvedOptions().weekday === 'monday' ? 1 : 0;

  let startOffset = firstOfMonth.getUTCDay() - firstDayOfWeek;
  if (startOffset < 0) startOffset += 7;

  const startDate = new Date(Date.UTC(year, month, 1 - startOffset));
  return startDate;
}

const AppCalender = ({
  showBuiltInLegend = true,
  weekSummaries,
  selectedDate: propsSelectedDate,
  onDateSelect,
  currentMonthDate: propsCurrentMonthDate,
  onMonthChange,
  dayStatuses,
  showActionColumn,
  renderStatus,
  renderAction,
  className,
  ...divProps
}: AppCalenderProps) => {
  const [selectedTimezone] = useState("America/Los_Angeles")
  const [locale] = useState("en-GB")
  const [selectionMode] = useState<SelectionMode>("day")
  const [internalCurrentDate, setInternalCurrentDate] = useState(() => getNowInTimezone('America/Los_Angeles', locale));
  const currentDate = propsCurrentMonthDate ?? internalCurrentDate;

  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(null);
  const selectedDate = propsSelectedDate !== undefined ? propsSelectedDate : internalSelectedDate;

  const [selectedWeekDates, setSelectedWeekDates] = useState<Date[]>([]);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showYearSelect, setShowYearSelect] = useState(false);

  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i)).toLocaleString(locale, { month: 'long', timeZone: selectedTimezone })
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

  // Get days of week based on locale
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.UTC(2021, 0, 3 + i)); // Start with a Sunday
    return date.toLocaleString(locale, { weekday: 'short' });
  });

  // Rotate days array based on locale's first day of week
  const firstDayOfWeek = new Intl.DateTimeFormat(locale).resolvedOptions().weekday === 'monday' ? 1 : 0;
  const rotatedDays = [
    ...daysOfWeek.slice(firstDayOfWeek),
    ...daysOfWeek.slice(0, firstDayOfWeek)
  ];

  const getDateInfo = useCallback((date: Date): { status: DateStatus; color?: string } => {
    if (dayStatuses) {
      const key = date.toISOString().split('T')[0]
      const info = dayStatuses[key]
      if (info) {
        return {
          status: info.status,
          color: info.color
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
      const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() + i));

      const isSelected = selectionMode === 'day' && selectedDate
        ? date.getTime() === selectedDate.getTime()
        : false;

      const isWeekSelected = selectionMode === 'week'
        ? selectedWeekDates.some(d => d.getTime() === date.getTime())
        : false;

      const isToday = date.getTime() === today.getTime();

      currentWeek.push({
        date,
        day: date.getUTCDate(),
        weekDay: rotatedDays[date.getUTCDay()],
        isCurrentMonth: date.getUTCMonth() === currentDate.getUTCMonth(),
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
    return weeks
  }, [currentDate, selectedDate, selectedWeekDates, selectedTimezone, selectionMode, getDateInfo, locale, rotatedDays]);

  const handleDayClick = (date: Date) => {
    if (selectionMode === 'day') {
      if (onDateSelect) {
        onDateSelect(date);
      } else {
        setInternalSelectedDate(date);
      }
      setSelectedWeekDates([]);
    } else {
      const firstDayOfWeek = new Intl.DateTimeFormat(locale).resolvedOptions().weekday === 'monday' ? 1 : 0;
      let dayOfWeek = date.getUTCDay() - firstDayOfWeek;
      if (dayOfWeek < 0) dayOfWeek += 7;

      const weekStart = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() - dayOfWeek
      ));

      const week = Array.from({ length: 7 }, (_, i) => {
        return new Date(Date.UTC(
          weekStart.getUTCFullYear(),
          weekStart.getUTCMonth(),
          weekStart.getUTCDate() + i
        ));
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

  return (
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
                onClick={() => handleMonthChange(new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1)))}
                className="p-2 rounded-full bg-[#6C5DD3] text-primary-foreground border-none cursor-pointer transition-all duration-200 ease-in-out hover:bg-[#6C5DD3]/90 focus:outline-none focus:ring-2 focus:ring-[#6C5DD3] focus:ring-opacity-50"
              >
                ‹
              </button>

              <div className="text-2xl font-semibold text-foreground">
                <Button variant="ghost" onClick={() => setShowMonthSelect(!showMonthSelect)}>
                  {currentDate.toLocaleString(locale, { month: 'long', timeZone: selectedTimezone })}
                </Button>{' '}
                <Button variant="ghost" onClick={() => setShowYearSelect(!showYearSelect)}>
                  {currentDate.toLocaleString(locale, { year: 'numeric', timeZone: selectedTimezone })}
                </Button>
              </div>

              <button
                onClick={() => handleMonthChange(new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1)))}
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
                      const parts = new Intl.DateTimeFormat(locale, {
                        year: 'numeric', month: 'numeric', day: 'numeric', timeZone: selectedTimezone
                      }).formatToParts(currentDate);
                      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
                      const newDate = new Date(Date.UTC(year, monthIndex, 1));
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
                      const parts = new Intl.DateTimeFormat(locale, {
                        year: 'numeric', month: 'numeric', day: 'numeric', timeZone: selectedTimezone
                      }).formatToParts(currentDate);
                      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
                      const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
                      const newDate = new Date(Date.UTC(year, month, day));
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

            {/* Single grid: Sun–Sat + TOTAL(MIN.) + STATUS + optionally ACTION per row */}
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
                    {week.map((dayObj, index) => (
                      <div
                        key={`${dayObj.date.getTime()}-${index}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleDayClick(dayObj.date)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleDayClick(dayObj.date)
                          }
                        }}
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
                            "z-[1] shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background !text-foreground",
                          dayObj.isWeekSelected &&
                            !dayObj.isSelected &&
                            "border-2 border-primary !text-primary font-medium"
                        )}
                        style={
                          {
                            backgroundColor: dayObj.color || "#f3f4f6", 
                          } as CSSProperties
                        }
                      >
                        {dayObj.day}
                      </div>
                    ))}
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
  )
}

export default AppCalender
export { AppCalender as TimeStudyCalendar }
