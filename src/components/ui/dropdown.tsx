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
  /** Arbitrary metadata associated with this option */
  metadata?: Record<string, any>
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
  /** When set, menu open state is controlled by the parent (e.g. only one of several pickers open). */
  open?: boolean
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
  /** Notified when the menu opens or closes (lazy-fetch on first open). */
  onOpenChange?: (open: boolean) => void
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
  open: openControlled,
  disabled = false,
  isLoading = false,
  loadingLabel = "Loading…",
  className,
  contentClassName,
  itemButtonClassName,
  itemLabelClassName,
  emptyListMessage = "No options available",
  emptyListSlot,
  onOpenChange,
}: SingleSelectDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const controlled = openControlled !== undefined
  const open = controlled ? openControlled : internalOpen
  const valueTrimmed = String(value ?? "").trim()

  const selectedLabel = useMemo(() => {
    if (!valueTrimmed) return ""
    return options.find((o) => o.value === valueTrimmed)?.label ?? ""
  }, [valueTrimmed, options])

  const disabledEffective = disabled || isLoading

  const setOpenState = (next: boolean) => {
    if (!controlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  const closeMenu = () => {
    if (!controlled) setInternalOpen(false)
    onOpenChange?.(false)
  }

  return (
    <DropdownMenu
      modal
      open={open}
      onOpenChange={setOpenState}
    >
      <DropdownMenuTrigger asChild disabled={disabledEffective}>
        <button
          type="button"
          disabled={disabledEffective}
          onBlur={onBlur}
          aria-label={placeholder}
          className={cn(
            "relative flex min-h-[43px] w-full items-center rounded-[7px] border border-[#c6cedd] bg-white px-3 py-1.5 pr-9 text-left shadow-none",
            "text-[11px] font-normal leading-[16px] text-[#111827]",
            "cursor-pointer outline-none focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]",
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
          "z-90 min-w-[8rem] w-(--radix-dropdown-menu-trigger-width) overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          reportsDropdownContentClassName,
          contentClassName,
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={closeMenu}
        onFocusOutside={closeMenu}
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
                    closeMenu()
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
