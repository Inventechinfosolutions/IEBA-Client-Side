import { useMemo, useRef, useState } from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { TimeSelectionUIProps } from "./types"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function parseTime(value: string | undefined) {
  const v = (value ?? "").trim()
  const match = /^(\d{2}):(\d{2})$/.exec(v)
  if (!match) return { hour: 0, minute: 0 }
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return { hour: 0, minute: 0 }
  return {
    hour: Math.min(23, Math.max(0, hour)),
    minute: Math.min(59, Math.max(0, minute)),
  }
}

const baseInputClassName =
  "h-[49px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[12px] text-[#1f2937] shadow-none placeholder:text-[12px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0"

const timeInputClassName =
  `${baseInputClassName} h-[49px] w-full pl-3 pr-9 text-center tabular-nums cursor-text ` +
  `[&::-webkit-calendar-picker-indicator]:opacity-0`

const timeInputDisabledClassName =
  `${baseInputClassName} h-[49px] w-full pl-3 pr-9 text-center tabular-nums bg-[#f2f2f2] cursor-not-allowed disabled:cursor-not-allowed disabled:opacity-100 disabled:text-[#111827] ` +
  `[&::-webkit-calendar-picker-indicator]:opacity-0`

export function TimeSelectionUI({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Start time",
  inputWidthClassName = "w-[120px]",
  dropdownWidthClassName = "w-[155px]",
}: TimeSelectionUIProps) {
  const [open, setOpen] = useState(false)
  const [draftHour, setDraftHour] = useState(0)
  const [draftMinute, setDraftMinute] = useState(0)
  const hourListRef = useRef<HTMLDivElement | null>(null)
  const minuteListRef = useRef<HTMLDivElement | null>(null)

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i), [])

  const scrollSelectedIntoView = (ref: React.RefObject<HTMLDivElement | null>) => {
    const root = ref.current
    if (!root) return
    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
    const selected = root.querySelector('[data-selected="true"]') as HTMLElement | null
    if (!viewport || !selected) return

    const paddingTop = 4
    viewport.scrollTo({ top: Math.max(0, selected.offsetTop - paddingTop) })
  }

  const commitDraft = (nextHour: number, nextMinute: number) => {
    setDraftHour(nextHour)
    setDraftMinute(nextMinute)
    onValueChange(`${pad2(nextHour)}:${pad2(nextMinute)}`)
  }

  return (
    <DropdownMenu
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        if (disabled) return
        setOpen(nextOpen)
        if (nextOpen) {
          const parsed = parseTime(value)
          setDraftHour(parsed.hour)
          setDraftMinute(parsed.minute)
          queueMicrotask(() => {
            scrollSelectedIntoView(hourListRef)
            scrollSelectedIntoView(minuteListRef)
          })
        }
      }}
    >
      <DropdownMenuTrigger asChild disabled={disabled}>
        <div className={`relative ${inputWidthClassName} ${disabled ? "cursor-not-allowed" : "cursor-text"}`}>
          <Input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={value ?? ""}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={(e) => {
              const el = e.currentTarget
              queueMicrotask(() => {
                try {
                  const end = el.value?.length ?? 0
                  el.setSelectionRange(end, end)
                } catch {
                  // ignore
                }
              })
            }}
            className={disabled ? timeInputDisabledClassName : timeInputClassName}
          />
          <Clock
            className={`pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 ${
              disabled ? "text-[#9ca3af]" : "text-[#6b7280]"
            }`}
          />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        onFocusOutside={(e) => e.preventDefault()}
        className={`${dropdownWidthClassName} rounded-[8px] border border-[#e4e7ef] bg-white p-2 shadow-[0_10px_30px_rgba(17,24,39,0.12)]`}
      >
        <div className="overflow-hidden rounded-[6px]">
          <div className="grid grid-cols-2 divide-x divide-[#e4e7ef]">
            <div className="p-1.5" ref={hourListRef}>
              <ScrollArea className="h-[260px]">
                <div className="p-1 pr-3">
                  {hourOptions.map((h) => {
                    const selected = h === draftHour
                    return (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          commitDraft(h, draftMinute)
                          queueMicrotask(() => scrollSelectedIntoView(hourListRef))
                        }}
                        data-selected={selected ? "true" : "false"}
                        className={`w-full rounded-[5px] px-2 py-1.5 text-center text-[16px] font-normal tabular-nums ${
                          selected ? "bg-[#dbeafe] text-[#111827]" : "text-[#111827] hover:bg-[#f2f2f2]"
                        }`}
                      >
                        {pad2(h)}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="p-1.5" ref={minuteListRef}>
              <ScrollArea className="h-[260px]">
                <div className="p-1 pr-3">
                  {minuteOptions.map((m) => {
                    const selected = m === draftMinute
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          commitDraft(draftHour, m)
                          queueMicrotask(() => scrollSelectedIntoView(minuteListRef))
                        }}
                        data-selected={selected ? "true" : "false"}
                        className={`w-full rounded-[5px] px-2 py-1.5 text-center text-[16px] font-normal tabular-nums ${
                          selected ? "bg-[#dbeafe] text-[#111827]" : "text-[#111827] hover:bg-[#f2f2f2]"
                        }`}
                      >
                        {pad2(m)}
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-end border-t border-[#e4e7ef] py-2">
          <Button
            type="button"
            onClick={() => {
              setOpen(false)
            }}
            className="h-10 rounded-[10px] bg-[var(--primary)] px-5 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
          >
            OK
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


