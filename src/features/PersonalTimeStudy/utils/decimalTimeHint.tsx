import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

export function buildDecimalMinMessage(value: string | number): string | null {
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const decimal = Number(trimmed)
  if (Number.isNaN(decimal)) return null
  const minutes = Math.round(decimal * 60)
  const label = Number(decimal.toFixed(2)).toString()
  return `${label} = ${minutes} mins`
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
