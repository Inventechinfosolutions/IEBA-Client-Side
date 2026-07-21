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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative w-full sm:w-[270px]">
        <TitleCaseInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={showHistory ? "Search Assignment Kind" : "Search here"}
          className="h-[50px] w-full rounded-[10px] border border-[#d0d5df] bg-white pl-3.5 pr-9 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {isSuperAdmin && (
          <Button
            type="button"
            className={`h-11 cursor-pointer gap-2 rounded-[10px] px-3 text-[12px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.05)] transition-colors w-full sm:w-auto ${
              showHistory
                ? "bg-[#6C5DD3] text-white hover:bg-[#5b4ebf]"
                : "border border-[#6C5DD3] bg-white text-[#6C5DD3] hover:bg-[#F3F0FF]"
            }`}
            onClick={onToggleHistory}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="size-3.5 animate-back-bounce" />
                Back to Job Pool
              </>
            ) : (
              <>
                <History className="size-3.5" />
                History
              </>
            )}
          </Button>
        )}

        {!showHistory && (
          <Button
            type="button"
            className="h-11 cursor-pointer gap-2 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#5b4ebf] w-full sm:w-auto"
            onClick={onToggleInactiveOnly}
          >
            {inactiveOnly ? (
              <span className="inline-flex size-[14px] items-center justify-center rounded-[3px] bg-white dark:bg-[#1C1C2D]">
                <Check className="size-[11px] stroke-[3] text-[#6C5DD3] dark:text-white" />
              </span>
            ) : (
              <span className="size-[14px] rounded-[3px] bg-white dark:bg-[#1C1C2D]" />
            )}
            Inactive
          </Button>
        )}

        {!showHistory && canAddJobPool && (
          <Button
            type="button"
            className="h-11 cursor-pointer gap-1 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#5b4ebf] w-full sm:w-auto"
            onClick={onAdd}
          >
            <Plus className="size-3.5" />
            Add Job Pool
          </Button>
        )}
      </div>
    </div>
  )
}

