import { Check, Search } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

import { type TransferItem, type TransferPanelProps } from "../../types"

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
      <div className="flex h-11 items-center gap-3 bg-[#6C5DD3] px-3 text-[13px] font-medium text-white">
        <span className="flex-1">{title}</span>
      </div>

      <div className="border-b border-[#E5E7EB] p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <Input
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 rounded-[8px] border-[#E5E7EB] bg-white pl-9 text-[13px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] transition-all"
          />
        </div>
      </div>

      <ScrollArea className="h-[280px]">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {isActivity && selectedDept ? (
              <div className="flex flex-col">
                <div className="flex h-9 cursor-pointer items-center justify-between bg-[#F3F4F6] px-4 text-[13px] font-semibold text-[#374151]">
                  <span>{selectedDept}</span>
                  <button
                    type="button"
                    onClick={onToggleAll}
                    disabled={!onToggleAll}
                    className={`flex size-5 items-center justify-center rounded-[6px] border shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                      allSelected
                        ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                        : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                    }`}
                  >
                    <Check className="size-3.2 stroke-3" />
                  </button>
                </div>
                <div className="px-6 py-1">
                  <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] font-bold text-[#374151] shadow-sm">
                    Activities
                  </span>
                </div>
              </div>
            ) : null}

            <div className={`flex flex-col ${isActivity ? "pl-6" : ""}`}>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative flex items-center text-[4px] justify-between px-4 py-1.5 text-left transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    } cursor-pointer`}
                  >
                    <div className="min-w-0 flex-1">
                      {isActivity ? (
                        <div className="absolute left-0 flex h-full w-8 items-center justify-center">
                          <div className="absolute left-4 top-0 h-full w-px bg-[#E5E7EB]" />
                          <div className="absolute left-4 top-1/2 h-px w-3 bg-[#E5E7EB]" />
                        </div>
                      ) : null}
                      <div
                        className={`pr-2 text-[10px] font-medium whitespace-normal break-words ${
                          isActivity ? "pl-6" : ""
                        }`}
                      >
                        {item.code ? (
                          <>
                            <div className="font-bold text-[#6C5DD3]">({item.code})</div>
                            <div className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                              {item.name}
                            </div>
                          </>
                        ) : (
                          <div className={isSelected ? "text-[#6C5DD3]" : "text-[#374151]"}>
                            {item.name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
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
          <div className="flex h-[280px] flex-col items-center justify-center bg-white">
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

