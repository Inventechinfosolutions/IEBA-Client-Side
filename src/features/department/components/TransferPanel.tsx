import { Search, Check } from "lucide-react"

import { ScrollArea } from "@/components/ui/scroll-area"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { DepartmentReportOption } from "../types"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type TransferPanelProps = {
  title: string
  items: DepartmentReportOption[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onSelectAll: (checked: boolean) => void
  searchValue: string
  onSearchChange: (value: string) => void
  className?: string
}

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onSelectAll,
  searchValue,
  onSearchChange,
  className,
}: TransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(String(item.id)))

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white flex-1 min-w-0", className)}>
      {/* Header */}
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[12px] font-medium text-white select-none">
        <span className="flex-1 truncate">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span>All</span>
          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className={`flex size-4 items-center justify-center rounded-[3px] border transition-colors ${allSelected ? "bg-white text-[#6C5DD3]" : "border-white/20 bg-white text-transparent"
              }`}
          >
            {allSelected && <Check className="size-3 stroke-[3.5] text-[#6C5DD3]" />}
          </button>
          <span className="min-w-[16px] text-center font-bold">{items.length}</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="border-b border-[#E5E7EB] p-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search here"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-[8px] border border-[#E5E7EB] bg-white pl-9 pr-3 text-[12px] placeholder:text-[#9CA3AF] focus-visible:ring-1 focus-visible:ring-[#6C5DD3] outline-none transition-all"
          />
        </div>
      </div>

      {/* Scrollable List */}
      <ScrollArea className="h-[180px] sm:h-[300px] py-1 px-1">
        {items.length > 0 ? (
          <div className="flex flex-col gap-0.5 min-w-0 w-full">
            {items.map((item) => {
              const isSelected = selectedIds.includes(String(item.id))
              return (
                <TooltipProvider key={item.id} delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onToggleItem(String(item.id))}
                        className={`flex w-full min-w-0 cursor-pointer items-center justify-between px-3 py-2 rounded-[6px] transition-colors text-left text-[12px] ${isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                          }`}
                      >
                        <span className={`truncate flex-1 pr-2 ${isSelected ? "text-[#6C5DD3]" : "text-[#374151]"}`}>
                          {item.label}
                        </span>
                        <div
                          className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${isSelected
                              ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                              : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                            }`}
                        >
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={4}
                      className="z-[2000] bg-black border border-black rounded-[8px] text-white text-xs px-3 py-1.5 shadow-md font-normal max-w-xs break-words"
                    >
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-16 object-contain opacity-60" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
