import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))


export type TimePickerDropdownProps = {
  /** Current value in "HH:MM" format */
  value: string
  /** Called with the new "HH:MM" string on selection */
  onChange: (v: string) => void
  /** Extra classes on the root div */
  className?: string
}



export function TimePickerDropdown({
  value,
  onChange,
  className,
}: TimePickerDropdownProps) {
  const parts = (value || "").split(":")
  const h = parts[0] ?? ""
  const m = parts[1] ?? ""

  return (
    <div 
      className={cn("flex h-[160px] divide-x", className)}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {/* Hours column */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-1">
          {HOURS.map((hour) => (
            <Button
              key={hour}
              type="button"
              variant="ghost"
              data-selected={h === hour}
              className={cn(
                "h-7 w-full justify-center text-[11px] font-normal",
                h === hour ? "bg-[#6C5DD3]/10 text-[#6C5DD3]" : "bg-transparent",
                "hover:bg-[#6C5DD3]/5"
              )}
              onClick={() => onChange(`${hour}:${m || "00"}`)}
            >
              {hour}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Minutes column */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-1">
          {MINUTES.map((minute) => (
            <Button
              key={minute}
              type="button"
              variant="ghost"
              data-selected={m === minute}
              className={cn(
                "h-7 w-full justify-center text-[11px] font-normal",
                m === minute ? "bg-[#6C5DD3]/10 text-[#6C5DD3]" : "bg-transparent",
                "hover:bg-[#6C5DD3]/5"
              )}
              onClick={() => onChange(`${h || "00"}:${minute}`)}
            >
              {minute}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}



