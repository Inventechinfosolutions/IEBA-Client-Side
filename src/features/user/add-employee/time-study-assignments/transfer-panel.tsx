import { Check, Search } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { AddEmployeeTimeStudyTransferPanelProps } from "../types"

export function TransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  searchValue,
  onSearchChange,
  selectedDept,
}: AddEmployeeTimeStudyTransferPanelProps) {
  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  /**
   * Normalize levels so we don't hardcode "level 1 = parent".
   * API may send levels starting from 0, 1, or 2.
   * minLevel item = parent (0 badges)
   * minLevel+1    = child  (1 badge ①)
   * minLevel+2    = grandchild (2 badges ①②)
   */
  const minLevel = items.length > 0
    ? Math.min(...items.map((i) => i.level ?? 1))
    : 1

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      {/* Purple header */}
      <div className="flex h-10 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[11px] font-medium text-white">
        <span className="flex-1">{title}</span>
      </div>

      {/* Search */}
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

      <ScrollArea className="h-[220px] py-2 px-2">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {/* Dept header row + toggle-all checkbox */}
            <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-2 text-[10px] font-semibold text-[#374151]">
              <span className="min-w-0">{selectedDept}</span>
              <button
                type="button"
                onClick={onToggleAll}
                className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                  allSelected
                    ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                    : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                }`}
                aria-label={`Toggle all ${selectedDept}`}
              >
                <Check className="size-3.5 stroke-3" />
              </button>
            </div>

            {/* Programs / Activities pill */}
            <div className="px-4 py-1">
              <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                {title.includes("Activities") ? "Activities" : "Programs"}
              </span>
            </div>

            {/*
              TREE LAYOUT
              ─────────────────────────────────────────────────────────
              · One vertical rail at x=20px, z-index:10 (always on top of hover bg)
              · Every row: horizontal branch ├─ starts at x=20px, 10px wide
              · badgeCount = rawLevel - minLevel
                  0 → primary program   — no badges
                  1 → sub-program       — ① (hover = parent name)
                  2 → sub-sub-program   — ①② (hover each for ancestor name)
              · hover bg is z-0 so rail line at z-10 stays visible through hover
            */}
            <div className="relative flex flex-col pb-2">

              {/* Single vertical rail — z-10 so hover bg never hides it */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-px bg-[#E5E7EB]"
                style={{ left: "30px", zIndex: 10 }}
              />

              {items.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                const rawLevel = item.level ?? minLevel
                const badgeCount = Math.max(0, rawLevel - minLevel)

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    className={`group relative z-0 flex cursor-pointer items-center justify-between py-1 pr-3 text-left transition-colors ${
                      isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {/* Left: ├─ branch + badges + name */}
                    <div className="flex min-w-0 flex-1 items-center gap-1 py-2">

                      {/* Horizontal branch — starts at rail x=28px */}
                      <div
                        className="h-px w-2.5 shrink-0 bg-[#E5E7EB]"
                        style={{ marginLeft: "30px" }}
                      />

                      {/* Ancestor badges — grows with depth */}
                      {badgeCount > 0 &&
                        Array.from({ length: badgeCount }).map((_, i) => {
                          const ancestor = item.ancestors?.[i]
                          return (
                            <div key={i} className="flex items-center">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className="relative flex size-[18px] shrink-0 cursor-help items-center justify-center rounded-full border border-[#6C5DD3] bg-white text-[9px] font-medium text-[#111827]"
                                      style={{ zIndex: 11 }}
                                    >
                                      {i + 1}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    {ancestor?.name || `Parent ${i + 1}`}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {/* Connector line between badges */}
                              {i < badgeCount - 1 && (
                                <div className="h-px w-1.5 shrink-0 bg-[#E5E7EB]" />
                              )}
                            </div>
                          )
                        })}

                      {/* Connector line between last badge and name */}
                      {badgeCount > 0 && (
                        <div className="h-px w-1.5 shrink-0 bg-[#E5E7EB]" />
                      )}

                      {/* Item name */}
                      <div className="ml-1 flex flex-wrap items-center gap-1 text-[10px] font-medium">
                        {item.code ? (
                          <>
                            <span className="font-bold text-[#6C5DD3]">({item.code})</span>
                            <span className="font-bold text-[#111827]"> — </span>
                            <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                              {item.name}
                            </span>
                          </>
                        ) : (
                          <span className={isSelected ? "text-[#6C5DD3]" : "text-[#111827]"}>
                            {item.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: checkbox */}
                    <div
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        isSelected
                          ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                    >
                      <Check className="size-3.5 stroke-3" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[220px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-20 object-contain opacity-80" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
