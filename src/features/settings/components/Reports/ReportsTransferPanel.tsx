import { Check, Search } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"
import { toTitleCase } from "@/lib/utils"

import type { ReportsTransferPanelProps } from "./reportsTransfer.types"

export function ReportsTransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  searchValue,
  onSearchChange,
  isLoading = false,
  loadingLabel = "Loading…",
  disabled = false,
}: ReportsTransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">{title}</span>
        {onToggleAll ? (
          <button
            type="button"
            onClick={onToggleAll}
            disabled={disabled || items.length === 0}
            className={`flex size-4.5 items-center justify-center rounded-[6px] border shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              allSelected
                ? "border-white bg-white text-[#6C5DD3]"
                : "border-white/40 bg-transparent text-transparent hover:border-white"
            }`}
          >
            <Check className="size-3.5 stroke-[3]" />
          </button>
        ) : null}
      </div>

      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <TitleCaseInput
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
            className="h-10 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      <ScrollArea className="h-[320px] px-2 py-2">
        {isLoading ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-2 bg-white">
            <Spinner className="text-[#6C5DD3]" />
            <span className="text-[11px] text-[#6B7280]">{loadingLabel}</span>
          </div>
        ) : items.length > 0 ? (
          <div className="flex flex-col">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onToggleItem(item.id)}
                  className={`group relative flex items-start justify-between px-4 py-1.5 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                  }`}
                >
                  <span className="min-w-0 flex-1 pr-2 text-[10px] font-medium whitespace-normal wrap-break-word">
                    {item.code ? (
                      <>
                        <span className="font-bold text-[#6C5DD3]">({item.code})</span>
                        <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                          {" "}
                          - {toTitleCase(item.name)}
                        </span>
                      </>
                    ) : (
                      <span className={isSelected ? "text-[#6C5DD3]" : "text-[#374151]"}>
                        {toTitleCase(item.name)}
                      </span>
                    )}
                  </span>

                  <div
                    className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                      isSelected
                        ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                        : "border-[#E5E7EB] bg-white text-transparent group-hover:border-[#D1D5DB]"
                    }`}
                  >
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center bg-white">
            <img
              src={tableEmptyIcon}
              alt="Empty"
              className="size-20 object-contain opacity-80"
            />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
