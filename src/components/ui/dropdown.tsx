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
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type SingleSelectOption = {
  value: string
  label: string
  /** Stable React `key` when `value` may repeat across options */
  key?: string
  /** When true, the option is visible but not selectable */
  disabled?: boolean
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
          <TooltipProvider>
            <Tooltip open={open ? false : undefined}>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate",
                    !isLoading && !selectedLabel && "text-[#9ca3af]",
                  )}
                >
                  {isLoading ? loadingLabel : selectedLabel || placeholder}
                </span>
              </TooltipTrigger>
              {selectedLabel && !isLoading && (
                <TooltipContent
                  side="top"
                  sideOffset={6}
                  className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                >
                  {selectedLabel}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {isLoading ? (
            <Spinner className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6C5DD3]" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        avoidCollisions={true}
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
            <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
              <img src={tableEmptyIcon} alt="" className="size-20 object-contain opacity-100" />
            </div>
          )
        ) : (
          <div className="p-1">
            {options.map((opt, index) => {
              const selected = valueTrimmed === opt.value
              const rowKey = opt.key ?? `${opt.value}-${index}`
              const optionDisabled = opt.disabled === true
              return (
                <TooltipProvider key={rowKey}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        disabled={optionDisabled}
                        aria-disabled={optionDisabled}
                        onClick={() => {
                          if (optionDisabled) return
                          onChange(opt.value)
                          closeMenu()
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left",
                          optionDisabled
                            ? "cursor-not-allowed text-[#9ca3af]"
                            : "cursor-pointer hover:bg-[#f3f4f8]",
                          selected && !optionDisabled ? "bg-[#eef8ff]" : "bg-transparent",
                          itemButtonClassName,
                        )}
                      >
                        <span
                          className={cn(
                            "block truncate text-[13px] font-normal",
                            optionDisabled ? "text-[#9ca3af]" : "text-[#111827]",
                            itemLabelClassName,
                          )}
                        >
                          {opt.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={6}
                      className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                    >
                      {opt.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
