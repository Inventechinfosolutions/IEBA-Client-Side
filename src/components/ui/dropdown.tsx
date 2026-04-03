"use client"

import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type SingleSelectOption = {
  value: string
  label: string
  /** Stable React `key` when `value` may repeat across options */
  key?: string
}

/** Same panel + scroll behavior as Settings → Reports → Reports dropdown (native scrollbar). */
const reportsDropdownContentClassName =
  "max-h-[260px] overflow-auto rounded-[7px] border border-[#d9deea] bg-white shadow-[0_8px_18px_rgba(17,24,39,0.12)]"

export type SingleSelectDropdownProps = {
  value: string
  onChange: (next: string) => void
  onBlur: () => void
  options: readonly SingleSelectOption[]
  placeholder: string
  disabled?: boolean
  isLoading?: boolean
  /** Trigger / loading text when `isLoading` (default: “Loading…”) */
  loadingLabel?: string
  className?: string
  /** Extra classes on the menu content (width, z-index, max-height, etc.) */
  contentClassName?: string
  /** Extra classes on each option row button */
  itemButtonClassName?: string
  /** Extra classes on each option label span */
  itemLabelClassName?: string
  /** Shown when `options` is empty and not loading (default: “No options available”). */
  emptyListMessage?: string
  /** Replaces default empty text when there are no options (e.g. illustration). */
  emptyListSlot?: ReactNode
}

/**
 * Single-choice dropdown: trigger shows one label (no chips). List styling matches
 * `MultiSelectDropdown` / Settings → Reports menus. Import from `@/components/ui/dropdown`.
 */
export function SingleSelectDropdown({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled = false,
  isLoading = false,
  loadingLabel = "Loading…",
  className,
  contentClassName,
  itemButtonClassName,
  itemLabelClassName,
  emptyListMessage = "No options available",
  emptyListSlot,
}: SingleSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const valueTrimmed = value.trim()

  const selectedLabel = useMemo(() => {
    if (!valueTrimmed) return ""
    return options.find((o) => o.value === valueTrimmed)?.label ?? ""
  }, [valueTrimmed, options])

  const disabledEffective = disabled || isLoading

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabledEffective}>
        <button
          type="button"
          disabled={disabledEffective}
          onBlur={onBlur}
          aria-label={placeholder}
          className={cn(
            "relative flex min-h-[43px] w-full items-center rounded-[7px] border border-[#c6cedd] bg-white px-3 py-1.5 pr-9 text-left shadow-none",
            "text-[11px] font-normal leading-[16px] text-[#111827]",
            "cursor-pointer outline-none focus-visible:border-[#3b82f6] focus-visible:ring-1 focus-visible:ring-[#3b82f640]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !isLoading && !selectedLabel && "text-[#9ca3af]",
            )}
          >
            {isLoading ? loadingLabel : selectedLabel || placeholder}
          </span>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={6}
        className={cn(
          "z-[90] w-[var(--radix-dropdown-menu-trigger-width)] p-0",
          reportsDropdownContentClassName,
          contentClassName,
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {options.length === 0 && !isLoading ? (
          emptyListSlot !== undefined ? (
            <div className="p-1">{emptyListSlot}</div>
          ) : (
            <div className="px-3 py-2 text-[11px] text-[#6b7280]">{emptyListMessage}</div>
          )
        ) : (
          <div className="p-1">
            {options.map((opt, index) => {
              const selected = valueTrimmed === opt.value
              const rowKey = opt.key ?? `${opt.value}-${index}`
              return (
                <button
                  type="button"
                  key={rowKey}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "w-full cursor-pointer px-3 py-2 text-left hover:bg-[#f3f4f8]",
                    selected ? "bg-[#eef8ff]" : "bg-transparent",
                    itemButtonClassName,
                  )}
                >
                  <span
                    className={cn(
                      "block truncate text-[11px] font-normal text-[#111827]",
                      itemLabelClassName,
                    )}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
