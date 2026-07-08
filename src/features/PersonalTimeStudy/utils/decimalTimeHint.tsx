import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

const QUARTER_HOUR_MINUTES = 15

export function formatDecimalHours(hours: number): string {
  return Number(hours.toFixed(2)).toString()
}

/** True when the value is already on a 0.25-hour (15-minute) increment. */
export function isQuarterHourDecimal(value: string | number): boolean {
  const trimmed = String(value).trim()
  if (!trimmed) return true
  const decimal = Number(trimmed)
  if (Number.isNaN(decimal)) return false
  const minutes = Math.round(decimal * 60)
  return minutes % QUARTER_HOUR_MINUTES === 0
}

/**
 * Rounds decimal hours to the nearest 15-minute increment (0.25 hrs).
 * Non-zero values below one increment round up to 0.25 (e.g. 0.12 → 0.25).
 */
export function roundDecimalHoursToQuarterHour(value: string | number): string {
  const trimmed = String(value).trim()
  if (!trimmed) return ""
  const decimal = Number(trimmed)
  if (Number.isNaN(decimal) || decimal < 0) return trimmed
  if (decimal === 0) return "0"

  const minutes = decimal * 60
  let roundedMinutes = Math.round(minutes / QUARTER_HOUR_MINUTES) * QUARTER_HOUR_MINUTES
  if (roundedMinutes === 0 && minutes > 0) {
    roundedMinutes = QUARTER_HOUR_MINUTES
  }

  return formatDecimalHours(roundedMinutes / 60)
}

export function buildDecimalMinMessage(value: string | number): string | null {
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const decimal = Number(trimmed)
  if (Number.isNaN(decimal)) return null
  const minutes = Math.round(decimal * 60)
  const label = formatDecimalHours(decimal)
  return `${label} hrs = ${minutes} mins`
}

export function DecimalActivityTimeHint({ message }: { message: string }) {
  return (
    <HoverCard openDelay={0} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold leading-none text-amber-700 hover:bg-amber-200"
          aria-label="Decimal time entry help"
          onClick={(e) => e.preventDefault()}
        >
          !
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        className="w-fit max-w-[220px] p-2 text-[11px] leading-snug text-[#111827] bg-white border border-gray-100 shadow-md rounded-md"
        side="top"
        align="end"
      >
        {message}
      </HoverCardContent>
    </HoverCard>
  )
}
