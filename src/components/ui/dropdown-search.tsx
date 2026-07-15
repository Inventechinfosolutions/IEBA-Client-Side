"use client"

import type { InputHTMLAttributes, KeyboardEvent, ReactNode } from "react"
import { useMemo, useRef, useState } from "react"
import { Search, ChevronDown } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
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
  /** Replaces default empty text when there are no options (e.g. illustration). */
  emptyListSlot?: ReactNode
  /** Notified when the menu opens or closes */
  onOpenChange?: (open: boolean) => void
  title?: string
  /** Extra attributes for the trigger input (e.g. data-pts-program for focus targets). */
  inputProps?: InputHTMLAttributes<HTMLInputElement>
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
  emptyListSlot,
  onOpenChange,
  title,
  inputProps,
}: SingleSelectSearchDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const dropdownId = useRef(Math.random().toString(36).substring(7)).current
  const inputRef = useRef<HTMLInputElement>(null)
  // Tracks whether a list item mousedown is in progress.
  // onMouseDown sets this true → input's onBlur sees it and skips closing.
  const selectingRef = useRef(false)
  const isOpenRef = useRef(false)

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

  const disabledEffective = disabled || (isLoading && !open)

  const openMenu = () => {
    if (disabledEffective) return
    if (!isOpenRef.current) {
      isOpenRef.current = true
      if (!controlled) setInternalOpen(true)
      onOpenChange?.(true)

      const selectedIndex = filteredOptions.findIndex((o) => String(o.value).trim() === valueTrimmed)
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }

  const closeMenu = () => {
    isOpenRef.current = false
    if (!controlled) setInternalOpen(false)
    onOpenChange?.(false)
    setSearchQuery("")
    setActiveIndex(-1)
  }

  const handleSelect = (optValue: string) => {
    onChange(optValue)
    closeMenu()
    inputRef.current?.blur()
  }

  const scrollToIndex = (index: number) => {
    setTimeout(() => {
      const activeEl = document.getElementById(`opt-${dropdownId}-${index}`)
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }, 0)
  }

  const focusableSelector =
    'a[href], area[href], input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), [tabindex="0"]'

  const focusNextTabbable = (currentEl: HTMLElement) => {
    setTimeout(() => {
      // Stay inside the time-entry form so Enter doesn't jump into calendar legend/notes.
      const root =
        (currentEl.closest("[data-time-entries-form]") as HTMLElement | null) ?? document.body
      const focusables = Array.from(root.querySelectorAll(focusableSelector)) as HTMLElement[]

      const visibleFocusables = focusables.filter((el) => {
        if (el.tabIndex < 0) return false
        const style = window.getComputedStyle(el)
        if (style.display === "none" || style.visibility === "hidden") return false
        return el.offsetWidth > 0 || el.offsetHeight > 0
      })

      const index = visibleFocusables.indexOf(currentEl)
      if (index >= 0 && index < visibleFocusables.length - 1) {
        visibleFocusables[index + 1].focus()
      } else {
        currentEl.blur()
      }
    }, 50)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabledEffective) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        if (!open) {
          openMenu()
        } else if (filteredOptions.length > 0) {
          const nextIndex = activeIndex < 0 ? 0 : (activeIndex + 1) % filteredOptions.length
          setActiveIndex(nextIndex)
          scrollToIndex(nextIndex)
        }
        break
      case "ArrowUp":
        e.preventDefault()
        if (!open) {
          openMenu()
        } else if (filteredOptions.length > 0) {
          const nextIndex = activeIndex < 0 ? filteredOptions.length - 1 : (activeIndex - 1 + filteredOptions.length) % filteredOptions.length
          setActiveIndex(nextIndex)
          scrollToIndex(nextIndex)
        }
        break
      case "Enter":
        if (open && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          e.preventDefault()
          onChange(filteredOptions[activeIndex].value)
          closeMenu()
          if (inputRef.current) {
            focusNextTabbable(inputRef.current)
          }
        }
        break
      case "Escape":
        if (open) {
          e.preventDefault()
          closeMenu()
        }
        break
      case "Tab":
        // Close the list so Tab moves to the next field, not into portaled options.
        if (open) closeMenu()
        break
      default:
        break
    }
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
            "relative flex min-h-[43px] w-full items-center rounded-[7px] border border-input bg-white px-3 py-1.5 pr-9",
            "focus-within:border-[#6C5DD3] focus-within:ring-1 focus-within:ring-[#6C5DD333]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <TooltipProvider>
            <Tooltip open={open ? false : undefined}>
              <TooltipTrigger asChild>
                <input
                  ref={inputRef}
                  type="text"
                  disabled={disabledEffective}
                  placeholder={inputPlaceholder}
                  value={inputDisplayValue}
                  {...inputProps}
                  // Open on focus/click
                  onFocus={(e) => {
                    inputProps?.onFocus?.(e)
                    openMenu()
                  }}
                  onClick={(e) => {
                    inputProps?.onClick?.(e)
                    openMenu()
                  }}
                  onKeyDown={(e) => {
                    inputProps?.onKeyDown?.(e)
                    if (e.defaultPrevented) return
                    handleKeyDown(e)
                  }}
                  onChange={(e) => {
                    inputProps?.onChange?.(e)
                    if (e.defaultPrevented) return
                    setSearchQuery(e.target.value)
                    if (!open) {
                      openMenu()
                    } else {
                      setActiveIndex(0)
                    }
                  }}
                  onBlur={(e) => {
                    inputProps?.onBlur?.(e)
                    if (selectingRef.current) return
                    onBlur()
                  }}
                  className={cn(
                    "min-w-0 flex-1 bg-transparent outline-none",
                    "text-[11px] font-normal leading-[16px] text-[#111827]",
                    "placeholder:text-[#9ca3af]",
                    disabledEffective && "cursor-not-allowed",
                    inputProps?.className,
                  )}
                />
              </TooltipTrigger>
              {!open && (selectedLabel || title) && (
                <TooltipContent
                  side="top"
                  sideOffset={6}
                  className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                >
                  {selectedLabel || title}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          {isLoading ? (
            <Spinner className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6C5DD3]" />
          ) : open ? (
            <Search className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#6b7280]" />
          ) : (
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        side="bottom"
        avoidCollisions={true}
        sideOffset={6}
        // Prevent popover from stealing focus away from the input
        onOpenAutoFocus={(e) => e.preventDefault()}
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
            <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
              <img src={tableEmptyIcon} alt="" className="size-20 object-contain opacity-100" />
            </div>
          )
        ) : (
          <div className="p-1">
            {filteredOptions.map((opt, index) => {
              const selected = valueTrimmed === opt.value
              const rowKey = opt.key ?? `${opt.value}-${index}`
              return (
                <TooltipProvider key={rowKey}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        id={`opt-${dropdownId}-${index}`}
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectingRef.current = true
                          handleSelect(opt.value)
                          selectingRef.current = false
                        }}
                        className={cn(
                          "w-full cursor-pointer rounded px-3 py-2 text-left hover:bg-[#f3f4f8]",
                          selected ? "bg-[#eef8ff]" : (index === activeIndex ? "bg-[#f3f4f8]" : "bg-transparent"),
                          itemButtonClassName,
                        )}
                      >
                        <span
                          className={cn(
                            "block truncate text-[13px] font-normal text-[#111827]",
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
      </PopoverContent>
    </Popover>
  )
}
