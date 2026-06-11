import { Check, Search } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toTitleCase } from "@/lib/utils"

import type {  TransferPanelProps } from "../../types"

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

            <div className={`flex flex-col ${isActivity ? "pl-6" : ""}`}>
              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative flex items-start justify-between px-4 py-1 text-left transition-colors cursor-pointer ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="flex items-start flex-1 min-w-0 pt-0.5">
                      {isActivity && (
                        <div className="absolute left-0 top-0 h-full w-8 flex items-center justify-center">
                          {/* Tree Lines */}
                          <div className="absolute left-4 top-0 w-px h-full bg-[#E5E7EB]" />
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 h-px bg-[#E5E7EB] ${item.isChild ? "w-2" : "w-3"}`} />
                        </div>
                      )}

                      {isActivity && item.isChild ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center pl-6 min-w-0">
                                <div className="flex items-center justify-center w-[16px] h-[22px] rounded-full border border-[#6C5DD3] bg-white text-[#6C5DD3] text-[10px] font-bold shrink-0">
                                  {item.level || 1}
                                </div>
                                <div className="w-2 h-px bg-[#E5E7EB] ml-[3px] mr-[2px] shrink-0" />
                                <span className="text-[10px] font-normal whitespace-normal wrap-break-word pr-2">
                                  <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                                    {toTitleCase(item.name)}
                                  </span>
                                  {item.code && (
                                    <span className="text-[#6C5DD3] font-normal">
                                      {" "}({item.code})
                                    </span>
                                  )}
                                </span>
                              </div>
                            </TooltipTrigger>
                            {item.parentName && (
                              <TooltipContent>
                                {item.parentName}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span
                          className={`text-[10px] font-medium whitespace-normal wrap-break-word pr-2 ${
                            isActivity ? "pl-6" : ""
                          }`}
                          title={item.isChild && item.parentName ? item.parentName : undefined}
                        >
                          {item.code ? (
                            <>
                              <span className="text-[#6C5DD3] font-bold">({item.code})</span>
                              {item.masterCodeType ? (
                                <>
                                  <span className="font-bold">-{item.masterCodeType.trim()}-</span>
                                  <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}> {toTitleCase(item.name)}</span>
                                </>
                              ) : (
                                <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}> - {toTitleCase(item.name)}</span>
                              )}
                            </>
                          ) : (
                            <span className={isSelected ? "text-[#6C5DD3]" : "text-[#374151]"}>
                              {item.masterCodeType ? (
                                <span className="font-bold">-{item.masterCodeType.trim()}- </span>
                              ) : null}
                              {toTitleCase(item.name)}
                            </span>
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all mt-0.5 ${
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

