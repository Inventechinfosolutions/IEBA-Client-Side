"use client"

import { useMemo, useRef, useState } from "react"

import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Search, X, ChevronDown, Check } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type MultiSelectSearchOption = {
  value: string
  label: string
}

export type MultiSelectSearchDropdownProps = {
  value: string
  onChange: (next: string) => void
  onBlur?: () => void
  options: readonly MultiSelectSearchOption[]
  placeholder: string
  disabled?: boolean
  isLoading?: boolean
  loadingLabel?: string
  maxVisibleItems?: number
  className?: string
  contentClassName?: string
}

/** Split stored comma / semicolon / newline-separated multi-select field. */
export function parseMultiSelectValues(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
}

function serializeValues(values: readonly string[]): string {
  return values.join(", ")
}

export function MultiSelectSearchDropdown({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled = false,
  isLoading = false,
  loadingLabel = "Loading…",
  maxVisibleItems = 2,
  className,
  contentClassName,
}: MultiSelectSearchDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const selectingRef = useRef(false)

  const open = internalOpen
  const selectedValues = useMemo(() => parseMultiSelectValues(value), [value])
  
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, searchQuery])

  const filteredValues = useMemo(() => filteredOptions.map((o) => o.value), [filteredOptions])
  const allFilteredSelected =
    filteredValues.length > 0 && filteredValues.every((v) => selectedValues.includes(v))

  const selectedItems = useMemo(() => {
    return selectedValues.map((v) => {
      const opt = options.find((o) => o.value === v)
      return { value: v, label: opt?.label ?? v }
    })
  }, [selectedValues, options])

  const toggle = (v: string) => {
    const set = new Set(selectedValues)
    if (set.has(v)) set.delete(v)
    else set.add(v)
    onChange(serializeValues([...set]))
  }

  const remove = (v: string) => {
    onChange(serializeValues(selectedValues.filter((x) => x !== v)))
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const remaining = selectedValues.filter((v) => !filteredValues.includes(v))
      onChange(serializeValues(remaining))
      return
    }
    const merged = new Set([...selectedValues, ...filteredValues])
    onChange(serializeValues([...merged]))
  }

  const disabledEffective = disabled || isLoading

  const openMenu = () => {
    if (disabledEffective) return
    setInternalOpen(true)
  }

  const closeMenu = () => {
    setInternalOpen(false)
    setSearchQuery("")
  }

  const handleContainerClick = () => {
    if (disabled) return
    inputRef.current?.focus()
    openMenu()
  }

  const hasSelection = selectedItems.length > 0

  return (
    <Popover modal={false} open={open} onOpenChange={(next) => { if (!next) closeMenu() }}>
      <PopoverAnchor asChild>
        <div
          onClick={handleContainerClick}
          className={cn(
            "relative flex min-h-[46px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-[6px] border border-[#d6d7dc] bg-white px-3 py-1.5 pr-9 text-left shadow-none outline-none",
            "focus-within:border-[#6C5DD3] focus-within:ring-1 focus-within:ring-[#6C5DD333]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {isLoading && selectedItems.length === 0 ? (
              <span className="text-[14px] text-[#9ca3af]">{loadingLabel}</span>
            ) : (
              <>
                {selectedItems.slice(0, maxVisibleItems).map((a) => (
                  <TooltipProvider key={a.value}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className="inline-flex max-w-30 shrink-0 items-center gap-2 rounded-[2px] bg-[#eef0f5] px-1.5 py-0.5 text-[14px] text-[#111827]"
                        >
                          <span className="truncate">{a.label}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="ml-0.5 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] text-[#6b7280]"
                            onPointerDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              remove(a.value)
                            }}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return
                              e.preventDefault()
                              e.stopPropagation()
                              remove(a.value)
                            }}
                            aria-label={`Remove ${a.label}`}
                          >
                            <X className="size-3" />
                          </span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={6}
                        className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                      >
                        {a.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {selectedItems.length > maxVisibleItems && (
                  <span className="inline-flex shrink-0 items-center rounded-[8px] bg-[#eef0f5] px-2 py-0.5 text-[14px] font-semibold tabular-nums text-[#111827]">
                    +{selectedItems.length - maxVisibleItems}
                  </span>
                )}
                {!isLoading && (
                  <input
                    ref={inputRef}
                    type="text"
                    disabled={disabledEffective}
                    placeholder={hasSelection ? "" : placeholder}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      if (!open) openMenu()
                    }}
                    onFocus={openMenu}
                    onBlur={() => {
                      if (selectingRef.current) return
                      onBlur?.()
                    }}
                    className={cn(
                      "min-w-[50px] flex-1 bg-transparent outline-none",
                      "text-[14px] font-normal leading-[20px] text-[#111827]",
                      "placeholder:text-[#9ca3af]",
                      disabledEffective && "cursor-not-allowed",
                    )}
                  />
                )}
              </>
            )}
          </div>
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
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className={cn(
          "z-1000 w-(--radix-popover-trigger-width) p-0",
          "max-h-[260px] overflow-auto rounded-[7px] border border-[#d9deea] bg-white dark:bg-[#18181b] dark:border-[rgba(108,93,211,0.4)] shadow-[0_8px_18px_rgba(17,24,39,0.12)]",
          contentClassName
        )}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement
          if (inputRef.current?.contains(target)) {
            e.preventDefault()
          } else {
            closeMenu()
          }
        }}
      >
        {filteredOptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
            <img src={tableEmptyIcon} alt="" className="size-20 object-contain opacity-100" />
            <p className="mt-2 text-[14px] text-[#6b7280]">
              {options.length === 0 ? "" : "No matching results"}
            </p>
          </div>
        ) : (
          <div className="p-1">
            <button
              type="button"
              className={cn(
                "flex w-full cursor-pointer items-center justify-between gap-3 border-b border-[#e5e7eb] dark:border-[rgba(108,93,211,0.3)] px-3 py-2 hover:bg-[#f5f5f5] dark:hover:bg-[#2a1f52] dark:text-[#e4e4e7]",
                allFilteredSelected ? "bg-[#e6f4ff] dark:bg-[#1c1538]" : "bg-transparent",
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                selectingRef.current = true
              }}
              onMouseUp={() => {
                selectingRef.current = false
              }}
              onClick={() => toggleSelectAll()}
            >
              <span className="flex-1 truncate text-left text-[14px] font-medium text-[#111827]">Select All</span>
              {allFilteredSelected && <Check className="size-4 shrink-0 text-[#1890ff]" strokeWidth={3} />}
            </button>
            {filteredOptions.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <TooltipProvider key={opt.value}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 hover:bg-[#f5f5f5] dark:hover:bg-[#2a1f52] dark:text-[#e4e4e7]",
                          selected ? "bg-[#e6f4ff] dark:bg-[#1c1538]" : "bg-transparent",
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          selectingRef.current = true
                        }}
                        onMouseUp={() => {
                          selectingRef.current = false
                        }}
                        onClick={() => toggle(opt.value)}
                      >
                        <span className="min-w-0 flex-1 truncate text-left text-[14px] font-normal text-[#111827]">
                          {opt.label}
                        </span>
                        {selected && <Check className="size-4 shrink-0 text-[#1890ff]" strokeWidth={3} />}
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
