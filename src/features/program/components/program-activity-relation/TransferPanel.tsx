import { Check, Search } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { TransferItem, TransferPanelProps } from "../../types"

const ROW_NAME_MAX_LENGTH = 70

function truncateLabelName(name: string, maxLength = ROW_NAME_MAX_LENGTH): string {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength)}…`
}

function RowLabel({ item, isSelected }: { item: TransferItem; isSelected: boolean }) {
  const displayName = truncateLabelName(item.name)
  const showFullNameTooltip = item.name.length > ROW_NAME_MAX_LENGTH

  if (item.code) {
    const rowColorClass = isSelected ? "text-[#6C5DD3]" : "text-[#111827]"
    return (
      <div className={`flex min-w-0 overflow-hidden ${rowColorClass}`}>
        <span className="shrink-0 font-bold text-[#6C5DD3]">({item.code})</span>
        <span className="shrink-0 font-bold text-[#111827]"> - </span>
        <span className="min-w-0" title={showFullNameTooltip ? item.name : undefined}>
          {displayName}
        </span>
      </div>
    )
  }

  return (
    <div className={isSelected ? "text-[#6C5DD3]" : "text-[#374151]"}>
      <span className="font-bold text-[#111827]"> - </span>
      <span title={showFullNameTooltip ? item.name : undefined}>{displayName}</span>
    </div>
  )
}

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  searchValue,
  onSearchChange,
  isActivity = false,
  selectedDept,
}: TransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">{title}</span>
      </div>

      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <TitleCaseInput
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all"
          />
        </div>
      </div>

      <ScrollArea className="h-[380px] py-2 px-2">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {isActivity && selectedDept ? (
              <div className="flex flex-col">
                <div className="flex h-7 cursor-pointer items-center justify-between bg-[#F3F4F6] px-4 text-[10px] font-semibold text-[#374151]">
                  <span>{selectedDept}</span>
                  <button
                    type="button"
                    onClick={onToggleAll}
                    disabled={!onToggleAll}
                    className={`flex size-4.5 items-center justify-center rounded-[6px] border shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      allSelected
                        ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                        : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                    }`}
                  >
                    <Check className="size-3.5 stroke-[3]" />
                  </button>
                </div>
                <div className="px-3 py-0.5">
                  <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                    Activities
                  </span>
                </div>
              </div>
            ) : null}

            <div className={`flex flex-col ${isActivity ? "pl-1" : ""}`}>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative flex cursor-pointer items-center justify-between px-4 py-1 text-left transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      {isActivity ? (
                        <div className="absolute left-4 top-0.5 flex h-full w-8 items-center justify-center">
                          <div className="absolute left-1 top-0 h-full w-px bg-[#E5E7EB]" />
                          <div className="absolute left-1 top-1/2 h-px w-3 bg-[#E5E7EB]" />
                        </div>
                      ) : null}
                      <div
                        className={`min-w-0 text-[10px] font-medium ${
                          isActivity ? "pl-6" : ""
                        }`}
                      >
                        <RowLabel item={item} isSelected={isSelected} />
                      </div>
                    </div>

                    <div
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                  </button>
                )
              })}
            </div>
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

