import { ArrowLeft, Check, History, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"
import type { JobPoolToolbarProps } from "../types"

export function JobPoolToolbar({
  searchValue,
  inactiveOnly,
  onSearchChange,
  onToggleInactiveOnly,
  onAdd,
  showHistory,
  onToggleHistory,
}: JobPoolToolbarProps & { showHistory: boolean; onToggleHistory: () => void }) {
  const { canAdd, isSuperAdmin } = usePermissions()
  const canAddJobPool = canAdd("jobpool")
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full min-w-0">
      <div className="relative w-full xl:w-[270px] shrink-0 min-w-0">
        <TitleCaseInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={showHistory ? "Search Assignment Kind" : "Search here"}
          className="h-[46px] sm:h-[50px] w-full rounded-[10px] border border-[#d0d5df] bg-white pl-3.5 pr-9 text-[11px] sm:text-[13px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[11px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
        />
        {searchValue.length > 0 && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] cursor-pointer"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSearchChange("")}
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 w-full xl:w-auto min-w-0">
        {isSuperAdmin && (
          <Button
            type="button"
            className={`h-[46px] sm:h-[50px] shrink-0 cursor-pointer gap-1.5 rounded-[10px] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap ${
              showHistory
                ? "bg-[#6C5DD3] text-white hover:bg-[#6C5DD3]"
                : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
            }`}
            onClick={onToggleHistory}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="size-3.5 shrink-0 animate-back-bounce" />
                <span>Back to Job Pool</span>
              </>
            ) : (
              <>
                <History className="size-3.5 shrink-0" />
                <span>History</span>
              </>
            )}
          </Button>
        )}

        {!showHistory && (
          <Button
            type="button"
            className="h-[46px] sm:h-[50px] shrink-0 cursor-pointer gap-1.5 rounded-[10px] bg-[#6C5DD3] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3] whitespace-nowrap"
            onClick={onToggleInactiveOnly}
          >
            {inactiveOnly ? (
              <span className="inline-flex size-[14px] items-center justify-center rounded-[3px] bg-white dark:bg-[#1C1C2D]">
                <Check className="size-[11px] stroke-[3] text-[#6C5DD3] dark:text-white" />
              </span>
            ) : (
              <span className="size-[14px] rounded-[3px] bg-white dark:bg-[#1C1C2D]" />
            )}
            <span>Inactive</span>
          </Button>
        )}

        {!showHistory && canAddJobPool && (
          <Button
            type="button"
            className="h-[46px] sm:h-[50px] flex-1 xl:flex-none min-w-0 cursor-pointer gap-1 rounded-[10px] bg-[#6C5DD3] px-2.5 sm:px-3 text-[11px] sm:text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3] justify-center text-center whitespace-nowrap"
            onClick={onAdd}
          >
            <Plus className="size-3.5 shrink-0" />
            <span className="truncate">Add Job Pool</span>
          </Button>
        )}
      </div>
    </div>
  )
}
