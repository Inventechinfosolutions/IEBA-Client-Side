"use client"

import { useMemo } from "react"
import { Check, ChevronDown, X } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export type MultiSelectOption = {
  value: string
  label: string
}

/** Split stored comma / semicolon / newline-separated multi-select field (same as assignedMultiCodes). */
export function parseMultiSelectStoredValues(raw: string): string[] {
  return raw
    .split(/[,;\n]+/g)
    .map((p) => p.trim())
    .filter(Boolean)
}

function serializeStoredValues(values: readonly string[]): string {
  return values.join(", ")
}

/** Same panel + scroll behavior as Settings → Reports → Reports dropdown (native scrollbar). */
const reportsDropdownContentClassName =
  "max-h-[260px] overflow-auto rounded-[7px] border border-[#d9deea] bg-white shadow-[0_8px_18px_rgba(17,24,39,0.12)]"

export type MultiSelectDropdownProps = {
  value: string
  onChange: (next: string) => void
  onBlur: () => void
  options: readonly MultiSelectOption[]
  placeholder: string
  disabled?: boolean
  isLoading?: boolean
  /** Visible selections in the trigger before “+N…” (Settings → Reports uses 2). */
  maxVisibleItems?: number
  className?: string
  /** Shown when `options` is empty and not loading (default: “No options available”). */
  emptyListMessage?: string
  /** Radix menu open state (e.g. lazy-fetch catalog on first open in edit mode). */
  onOpenChange?: (open: boolean) => void
}

/**
 * Multi-select with removable tags in the trigger and blue checkmarks in the list.
 * Used by Settings → Reports and Add Employee job classification / MultiCodes.
 */
export function MultiSelectDropdown({
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  disabled = false,
  isLoading = false,
  maxVisibleItems = 2,
  className,
  emptyListMessage = "No options available",
  onOpenChange,
}: MultiSelectDropdownProps) {
  const selectedValues = useMemo(() => parseMultiSelectStoredValues(value), [value])

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
    onChange(serializeStoredValues([...set]))
  }

  const remove = (v: string) => {
    onChange(serializeStoredValues(selectedValues.filter((x) => x !== v)))
  }

  const disabledEffective = disabled || isLoading

  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabledEffective}>
        <button
          type="button"
          disabled={disabledEffective}
          onBlur={onBlur}
          aria-label={placeholder}
          className={cn(
            "relative flex min-h-[43px] w-full flex-wrap items-center gap-2 rounded-[7px] border border-[#c6cedd] bg-white px-3 py-1.5 pr-9 text-left shadow-none",
            "text-[11px] font-normal leading-[16px] text-[#111827]",
            "cursor-pointer outline-none focus-visible:border-[#3b82f6] focus-visible:ring-1 focus-visible:ring-[#3b82f640]",
            disabledEffective && "cursor-not-allowed bg-[#f2f2f2] opacity-100",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {isLoading ? (
              <span className="text-[11px] text-[#9ca3af]">Loading…</span>
            ) : selectedItems.length === 0 ? (
              <span className="text-[11px] text-[#9ca3af]">{placeholder}</span>
            ) : (
              <>
                {selectedItems.slice(0, maxVisibleItems).map((a) => (
                  <span
                    key={a.value}
                    className="inline-flex max-w-full items-center gap-1 rounded-[2px] bg-[#eef0f5] px-2 py-0.5 text-[11px] text-[#111827]"
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
                ))}
                {selectedItems.length > maxVisibleItems ? (
                  <span className="inline-flex shrink-0 items-center rounded-[8px] bg-[#eef0f5] px-2 py-0.5 text-[11px] text-[#111827]">
                    +{selectedItems.length - maxVisibleItems}...
                  </span>
                ) : null}
              </>
            )}
          </div>
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
        )}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {options.length === 0 && !isLoading ? (
          <div className="px-3 py-2 text-[11px] text-[#6b7280]">{emptyListMessage}</div>
        ) : (
          <div className="p-1">
            {options.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-[#f3f4f8]",
                    selected ? "bg-[#eef8ff]" : "bg-transparent",
                  )}
                >
                  <span className="truncate text-[11px] font-normal text-[#111827]">{opt.label}</span>
                  {selected ? <Check className="size-4 shrink-0 text-[#2563eb]" strokeWidth={2.5} /> : null}
                </button>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
