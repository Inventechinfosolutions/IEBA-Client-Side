import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"
import type { ProgramToolbarProps } from "../types"

function getAddLabel(activeTabLabel: string) {
  if (activeTabLabel === "Budget Units") return "Add Budget Units"
  if (activeTabLabel === "Time Study programs") return "Add Time Study Program"
  return "Add Program Activity Relation"
}

function getSearchPlaceholder(activeTabLabel: string) {
  if (activeTabLabel === "Time Study programs") return "Search Here"
  if (activeTabLabel === "Budget Units") return "Search BU Code"
  return "Search here"
}

export function ProgramToolbar({
  activeTabLabel,
  searchValue,
  inactiveOnly,
  onSearchChange,
  onToggleInactiveOnly,
  onAddProgram,
  hideAdd = false,
}: ProgramToolbarProps) {
  const { canAdd } = usePermissions()

  const getModuleKey = (tab: string) => {
    if (tab === "Budget Units") return "budgetprogram"
    if (tab === "Time Study programs") return "timestudyprogram"
    return "timestudyactivity"
  }

  const showAdd = canAdd(getModuleKey(activeTabLabel)) && !hideAdd

  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <TitleCaseInput
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={getSearchPlaceholder(activeTabLabel)}
        className="h-[41px] w-[270px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onToggleInactiveOnly}
        >
          {inactiveOnly ? (
            <Check className="size-[11px] stroke-[3] text-white" />
          ) : (
            <span className="size-[11px] rounded-[2px] bg-white" />
          )}
          Inactive
        </Button>
        {showAdd && (
          <Button
            type="button"
            className="h-9 cursor-pointer gap-1 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
            onClick={onAddProgram}
          >
            <Plus className="size-3.5" />
            {getAddLabel(activeTabLabel)}
          </Button>
        )}
      </div>
    </div>
  )
}

