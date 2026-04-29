import { useState, useEffect } from "react"
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
  /** Called when the OK button is clicked */
  onClose?: () => void
  /** Extra classes on the root div */
  className?: string
}



export function TimePickerDropdown({
  value,
  onChange,
  onClose,
  className,
}: TimePickerDropdownProps) {
  const [localTime, setLocalTime] = useState(value || "00:00")

  // Sync local state if external value changes (e.g. when popover reopens)
  useEffect(() => {
    setLocalTime(value || "00:00")
  }, [value])

  const parts = localTime.split(":")
  const h = parts[0] ?? ""
  const m = parts[1] ?? ""

  const handleOk = () => {
    onChange(localTime)
    if (onClose) onClose()
  }

  return (
    <div 
      className={cn("flex flex-col w-[120px] bg-white overflow-hidden rounded-md", className)}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex h-[200px] divide-x divide-gray-100">
        {/* Hours column */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 gap-0.5">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                data-selected={h === hour}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  h === hour ? "bg-[#eaf4ff] text-gray-900" : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setLocalTime(`${hour}:${m || "00"}`)}
              >
                {hour}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Minutes column */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 gap-0.5">
            {MINUTES.map((minute) => (
              <button
                key={minute}
                type="button"
                data-selected={m === minute}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  m === minute ? "bg-[#eaf4ff] text-gray-900" : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setLocalTime(`${h || "00"}:${minute}`)}
              >
                {minute}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-2 pt-1 pb-2 flex justify-end bg-white">
        <button
          type="button"
          onClick={handleOk}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-medium h-[28px] px-4 rounded-[4px] transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  )
}



