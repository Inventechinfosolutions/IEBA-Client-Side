import { Search, Check } from "lucide-react"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toTitleCase } from "@/lib/utils"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { TransferPanelProps } from "../../types"

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  searchValue,
  onSearchChange,
  isActivity = false,
  count,
  selectedDept,
  isSearchDisabled = false,
  isListDisabled = false,
}: TransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  return (
    <div className="flex flex-col rounded-[8px] border border-[#E5E7EB] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex h-11 items-center bg-[#6C5DD3] px-3 text-[14px] font-bold text-white gap-3">
        {!isActivity ? (
          <>
            <span className="text-[14px] font-bold text-white whitespace-nowrap">
              {count} Items
            </span>
            <span className="flex-1 text-right">{title}</span>
          </>
        ) : (
          <>
            <span className="flex-1">{title}</span>
            <button
              type="button"
              onClick={onToggleAll}
              disabled={isListDisabled || !onToggleAll}
              className={`flex items-center gap-2 transition-opacity ${
                isListDisabled ? "cursor-not-allowed! opacity-60" : "cursor-pointer hover:opacity-80"
              }`}
            >
              <span className="text-white text-[12px] font-bold">All</span>
              <div
                className={`flex size-[18px] items-center justify-center rounded-[5px] border-0 shadow-sm transition-all ${
                  allSelected
                    ? "bg-[#6C5DD3] border-[#6C5DD3] text-white"
                    : "bg-white text-transparent opacity-100 hover:brightness-95"
                }`}
              >
                <Check className="size-3.2 stroke-3" />
              </div>
            </button>
            <span className="text-[14px] font-bold text-white whitespace-nowrap">
              {count}
            </span>
          </>
        )}
      </div>

      {/* Search/Input Area */}
      <div className="p-3 border-b border-[#E5E7EB]">
        <div className={`relative ${isSearchDisabled ? "cursor-not-allowed!" : ""}`}>
          {!isActivity && (
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          )}
          <TitleCaseInput
            placeholder={isActivity ? "" : "Search here"}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={isSearchDisabled}
            className={`h-11 rounded-[8px] border-[#E5E7EB] text-[13px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all ${
              !isActivity ? "pl-9" : "px-3"
            } ${isSearchDisabled ? "bg-[#F3F4F6] cursor-not-allowed! opacity-100 placeholder:opacity-50" : "bg-white"}`}
          />
        </div>
      </div>

      {/* List Area */}
      <ScrollArea className="h-[280px]">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {isActivity && selectedDept && (
              <div className="flex flex-col">
                {/* Department Header */}
                <div className="flex items-center justify-between px-4 h-9 bg-[#F3F4F6] text-[13px] font-semibold text-[#374151] cursor-pointer">
                  <span>{selectedDept}</span>
                  <button
                    type="button"
                    onClick={onToggleAll}
                    disabled={!onToggleAll}
                    className={`flex size-5 items-center justify-center rounded-[6px] border shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      allSelected
                        ? "bg-white border-[#6C5DD3] text-[#6C5DD3]"
                        : "bg-white border-[#D1D5DB] text-transparent hover:border-[#6C5DD3]/30"
                    }`}
                  >
                    <Check className="size-3.2 stroke-3" />
                  </button>
                </div>
                
                {/* Sub-header "Activity" */}
                <div className="px-6 py-1">
                  <span className="inline-flex items-center justify-center rounded-[6px] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm border border-[#E5E7EB]">
                    Activity
                  </span>
                </div>
              </div>
            )}

            <div className={`flex flex-col ${isActivity ? "pl-6" : ""}`}>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                const isDisabled = isListDisabled || item.disabled
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => !isDisabled && onToggleItem(item.id)}
                    disabled={isDisabled}
                    className={`group relative flex items-start justify-between px-4 py-3 text-left transition-colors border-b border-[#F3F4F6] last:border-0 ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    } ${isDisabled ? "cursor-not-allowed! opacity-50" : "cursor-pointer"}`}
                  >
                    <div className="flex items-start flex-1 min-w-0 pt-0.5">
                      {isActivity && (
                        <div className="absolute left-0 top-0 h-full w-8 flex items-center justify-center">
                          {/* Tree Lines */}
                          <div className="absolute left-4 top-0 w-px h-full bg-[#E5E7EB]" />
                          <div className="absolute left-4 top-[22px] w-3 h-px bg-[#E5E7EB]" />
                        </div>
                      )}
                      
                      <span className={`text-[13px] font-medium whitespace-normal wrap-break-word pr-2 ${isActivity ? "pl-6" : ""}`}>
                        {item.code ? (
                          <>
                            <span className="text-[#6C5DD3] font-bold">({item.code})</span>
                            <span className={isSelected ? "text-[#6C5DD3]" : (isDisabled ? "text-[#9CA3AF]" : "text-[#111827]")}> - {toTitleCase(item.name)}</span>
                          </>
                        ) : (
                          <span className={isSelected ? "text-[#6C5DD3]" : (isDisabled ? "text-[#9CA3AF]" : "text-[#374151]")}>{toTitleCase(item.name)}</span>
                        )}
                      </span>
                    </div>
 
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all mt-0.5 ${
                        isSelected
                          ? "bg-[#6C5DD3] border-[#6C5DD3] text-white"
                          : `bg-white border-[#D1D5DB] text-transparent ${isDisabled ? "bg-[#F3F4F6]" : "hover:border-[#6C5DD3]/30"}`
                      }`}
                    >
                      <Check className="size-3.2 stroke-3" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[280px] bg-white">
            <img 
              src={tableEmptyIcon} 
              alt="Empty" 
              className="size-24 object-contain opacity-80"
            />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
