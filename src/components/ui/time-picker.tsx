import { useState, useCallback } from "react"
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
  /** Interval between minutes (e.g. 15) */
  minuteStep?: number
}

export function TimePickerDropdown({
  value,
  onChange,
  onClose,
  className,
  minuteStep = 1,
}: TimePickerDropdownProps) {
  const [localTime, setLocalTime] = useState(value || "00:00")
  const [prevValue, setPrevValue] = useState(value)

  // Sync local state if external value changes without using useEffect
  if (value !== prevValue) {
    setPrevValue(value)
    setLocalTime(value || "00:00")
  }

  // Use a callback ref to scroll selected items into view when the component renders
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Use a microtask/timeout to ensure the DOM is ready for scrollIntoView
      setTimeout(() => {
        node.querySelectorAll('[data-selected="true"]').forEach((el) => {
          el.scrollIntoView({ block: "start", behavior: "auto" })
        })
      }, 0)
    }
  }, [])

  const parts = localTime.split(":")
  const h = parts[0] ?? ""
  const m = parts[1] ?? ""

  const filteredMinutes = MINUTES.filter((m) => parseInt(m, 10) % minuteStep === 0)

  const handleOk = () => {
    onChange(localTime)
    if (onClose) onClose()
  }

  return (
    <div
      ref={scrollRef}
      className={cn("flex flex-col w-[120px] bg-white overflow-hidden rounded-md", className)}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="flex h-[200px] divide-x divide-gray-100">
        {/* Hours column */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 pb-[170px] gap-0.5">
            {HOURS.map((hour) => (
              <button
                key={hour}
                type="button"
                data-selected={h === hour}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  h === hour ? "bg-[#eaf4ff] text-gray-900" : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => {
                  const newTime = `${hour}:${m || "00"}`
                  setLocalTime(newTime)
                  onChange(newTime)
                }}
              >
                {hour}
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Minutes column */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-1.5 pb-[170px] gap-0.5">
            {filteredMinutes.map((minute) => (
              <button
                key={minute}
                type="button"
                data-selected={m === minute}
                className={cn(
                  "flex h-7 w-full items-center justify-center rounded-[4px] text-[13px] font-normal transition-colors",
                  m === minute ? "bg-[#eaf4ff] text-gray-900" : "bg-transparent text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => {
                  const newTime = `${h || "00"}:${minute}`
                  setLocalTime(newTime)
                  onChange(newTime)
                }}
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
