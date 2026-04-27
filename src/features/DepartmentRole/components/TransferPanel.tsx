import { Check, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { TransferPanelProps } from "../types"

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  totalCount,
  allSelected,
  onSelectAll,
  onTogglePermission,
}: TransferPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[13px] font-medium text-white">
        <span className="flex-1">{title}</span>
        <div className="flex items-center gap-2 pr-2">
          <span>All</span>
          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className={`flex size-4 items-center justify-center rounded-[3px] border transition-colors ${
              allSelected ? "bg-white text-[#6C5DD3]" : "border-white/20 bg-white"
            }`}
          >
            {allSelected && <Check className="size-3 stroke-3 text-[#6C5DD3]" />}
          </button>
          <span className="min-w-[12px] text-center">{totalCount}</span>
        </div>
      </div>


      <ScrollArea className="h-[400px] py-2">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {items.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              const isExpanded = expandedIds.has(item.id)
              return (
                <div key={item.id} className="flex flex-col">
                  <div
                    className={`group relative flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-2" onClick={() => toggleExpand(item.id)}>
                      {isExpanded ? (
                        <ChevronDown className="size-4 shrink-0 text-[#9CA3AF]" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 text-[#9CA3AF]" />
                      )}
                      <span className="text-[14px] font-medium text-[#111827]">{item.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleItem(item.id)}
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[4px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    >
                      <Check className="size-3.5 stroke-3" />
                    </button>
                  </div>

                  {isExpanded && item.permissions.length > 0 && (
                    <div className="flex flex-col bg-white pb-2 px-1">
                      {item.permissions.map((perm, idx) => {
                        const isPermSelected = selectedIds.includes(`${item.id}:${perm}`)
                        return (
                          <div
                            key={idx}
                            className="relative flex items-center justify-between py-1.5 pl-10 pr-2 hover:bg-[#F9FAFB]/50 rounded-md"
                          >
                            {/* Tree lines */}
                            <div className="absolute left-[26px] top-0 h-full w-[1.5px] bg-[#E5E7EB]" />
                            <div className="absolute left-[26px] top-1/2 h-[1.5px] w-4 bg-[#E5E7EB]" />
                            
                            <span className="text-[13.5px] text-[#4B5563] leading-relaxed">{perm}</span>

                            <button
                              type="button"
                              onClick={() => onTogglePermission?.(item.id, perm)}
                              className={`flex size-4.5 shrink-0 items-center justify-center rounded-[4px] border shadow-sm transition-all ${
                                isPermSelected
                                  ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                                  : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                              }`}
                            >
                              <Check className="size-3.5 stroke-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[350px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-23 object-contain opacity-60" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
