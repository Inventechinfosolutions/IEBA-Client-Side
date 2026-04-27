"use client"

import type { ReactNode } from "react"
import { useMemo, useRef, useState } from "react"
import { Search, ChevronDown } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type SingleSelectOption = {
  value: string
  label: string
  /** Stable React `key` when `value` may repeat across options */
  key?: string
  /** Arbitrary metadata associated with this option */
  metadata?: Record<string, any>
}

export type SingleSelectSearchDropdownProps = {
  value: string
  onChange: (next: string) => void
  onBlur: () => void
  options: readonly SingleSelectOption[]
  placeholder: string
  /** When set, menu open state is controlled by the parent */
  open?: boolean
  disabled?: boolean
  isLoading?: boolean
  /** Trigger / loading text when `isLoading` (default: "Loading…") */
  loadingLabel?: string
  className?: string
  /** Extra classes on the menu content (width, z-index, max-height, etc.) */
  contentClassName?: string
  /** Extra classes on each option row button */
  itemButtonClassName?: string
  /** Extra classes on each option label span */
  itemLabelClassName?: string
  /** Shown when `options` is empty and not loading (default: "No options available"). */
  emptyListMessage?: string
  /** Replaces default empty text when there are no options (e.g. illustration). */
  emptyListSlot?: ReactNode
  /** Notified when the menu opens or closes */
  onOpenChange?: (open: boolean) => void
}

export function SingleSelectSearchDropdown({
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
}: SingleSelectSearchDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  // Tracks whether a list item mousedown is in progress.
  // onMouseDown sets this true → input's onBlur sees it and skips closing.
  const selectingRef = useRef(false)

  const controlled = openControlled !== undefined
  const open = controlled ? openControlled : internalOpen

  const valueTrimmed = String(value ?? "").trim()

  const selectedLabel = useMemo(
    () => (valueTrimmed ? (options.find((o) => o.value === valueTrimmed)?.label ?? valueTrimmed) : ""),
    [valueTrimmed, options],
  )

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchQuery])

  const disabledEffective = disabled || isLoading

  const openMenu = () => {
    if (disabledEffective) return
    if (!controlled) setInternalOpen(true)
    onOpenChange?.(true)
    // Input is the anchor — focus is already there
  }

  const closeMenu = () => {
    if (!controlled) setInternalOpen(false)
    onOpenChange?.(false)
    setSearchQuery("")
  }

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    closeMenu()
    inputRef.current?.blur()
  }

  // What the input should display
  const inputDisplayValue = open
    ? searchQuery                          // while open: show what user is typing
    : isLoading
    ? ""
    : selectedLabel                        // while closed: show selected label

  const inputPlaceholder = open
    ? (selectedLabel || placeholder)       // ghost-text hint while searching
    : isLoading
    ? loadingLabel
    : placeholder

  return (
    <Popover modal={false} open={open} onOpenChange={(next) => { if (!next) closeMenu() }}>
      {/* PopoverAnchor lets the content align to this element without it being the trigger */}
      <PopoverAnchor asChild>
        <div
          className={cn(
            "relative flex min-h-[43px] w-full items-center rounded-[7px] border border-[#c6cedd] bg-white px-3 py-1.5 pr-9",
            "focus-within:border-[#6C5DD3] focus-within:ring-1 focus-within:ring-[#6C5DD333]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <input
            ref={inputRef}
            type="text"
            disabled={disabledEffective}
            placeholder={inputPlaceholder}
            value={inputDisplayValue}
            // Open on focus/click
            onFocus={openMenu}
            onClick={openMenu}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (!open) openMenu()
            }}
            onBlur={() => {
              if (selectingRef.current) return

              onBlur()
            }}
            className={cn(
              "min-w-0 flex-1 bg-transparent outline-none",
              "text-[11px] font-normal leading-[16px] text-[#111827]",
              "placeholder:text-[#9ca3af]",
              disabledEffective && "cursor-not-allowed",
            )}
          />
          {open ? (
            <Search className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-[#6b7280]" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        avoidCollisions={false}
        sideOffset={6}
        // Prevent popover from stealing focus away from the input
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
        className={cn(
          "z-[1000] p-0",
          "w-[var(--radix-popover-trigger-width)]",
          "max-h-[260px] overflow-auto rounded-[7px] border border-[#d9deea] bg-white shadow-[0_8px_18px_rgba(17,24,39,0.12)]",
          contentClassName,
        )}
        // Keep focus on input when interacting with the list
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (inputRef.current?.contains(target)) {
            e.preventDefault()
          } else {
            closeMenu()
          }
        }}
      >
        {filteredOptions.length === 0 && !isLoading ? (
          emptyListSlot !== undefined ? (
            <div className="p-1">{emptyListSlot}</div>
          ) : (
            <div className="px-3 py-2 text-[11px] text-[#6b7280]">{emptyListMessage}</div>
          )
        ) : (
          <div className="p-1">
            {filteredOptions.map((opt, index) => {
              const selected = valueTrimmed === opt.value
              const rowKey = opt.key ?? `${opt.value}-${index}`
              return (
                <button
                  type="button"
                  key={rowKey}
                  // onMouseDown fires before input's onBlur.
                  // e.preventDefault() keeps focus on the input (no blur flash).
                  // selectingRef guards the onBlur from closing the menu.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectingRef.current = true
                    handleSelect(opt.value)
                    selectingRef.current = false
                  }}
                  className={cn(
                    "w-full cursor-pointer rounded px-3 py-2 text-left hover:bg-[#f3f4f8]",
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
      </PopoverContent>
    </Popover>
  )
}
