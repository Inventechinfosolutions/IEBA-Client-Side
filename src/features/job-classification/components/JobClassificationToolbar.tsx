import { Check, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"
import type { JobClassificationToolbarProps } from "../types"

export function JobClassificationToolbar({
  searchValue,
  inactiveOnly,
  onSearchChange,
  onToggleInactiveOnly,
  onAdd,
}: JobClassificationToolbarProps) {
  const { canAdd } = usePermissions()
  const canAddJobClassification = canAdd("jobclassification")
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative w-full sm:w-[270px]">
        <TitleCaseInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search Here"
          className="h-[50px] w-full rounded-[10px] border border-[#d0d5df] bg-white pl-3.5 pr-9 text-[13px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[13px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
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
        <Button
          type="button"
          className="h-11 cursor-pointer gap-2 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#5b4ebf] w-full sm:w-auto"
          onClick={onToggleInactiveOnly}
        >
          {inactiveOnly ? (
            <Check className="size-[11px] stroke-[3] text-white" />
          ) : (
            <span className="size-[11px] rounded-[2px] bg-white" />
          )}
          Inactive
        </Button>
        {canAddJobClassification && (
          <Button
            type="button"
            className="h-11 cursor-pointer gap-1 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#5b4ebf] w-full sm:w-auto"
            onClick={onAdd}
          >
            <Plus className="size-3.5" />
            Add Job Classification
          </Button>
        )}
      </div>
    </div>
  )
}

