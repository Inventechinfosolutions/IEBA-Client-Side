import { ArrowLeft, Check, History, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { usePermissions } from "@/hooks/usePermissions"
import type { ProgramToolbarProps } from "../types"

function getAddLabel(activeTabLabel: string) {
  if (activeTabLabel === "Budget Units") return "Add Budget Units"
  if (activeTabLabel === "Time Study programs") return "Add Time Study Program"
  return "Add Program Activity Relation"
}

function getSearchPlaceholder(activeTabLabel: string, showHistory: boolean) {
  if (showHistory) return "Search Program Code"
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
  showHistory = false,
  onToggleHistory,
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
        placeholder={getSearchPlaceholder(activeTabLabel, showHistory)}
        className="h-[41px] w-[270px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
      />
      <div className="flex items-center gap-2">
        {onToggleHistory && (
          <Button
            type="button"
            className={`h-9 cursor-pointer gap-2 rounded-[12px] px-3 text-[12px] font-semibold transition-all shadow-[0_1px_0_rgba(0,0,0,0.05)] ${
              showHistory
                ? "bg-[#6C5DD3] text-white hover:bg-[#6C5DD3]"
                : "bg-white border border-[#E5E7EB] text-[#6C5DD3] hover:bg-[#F3F0FF] hover:border-[#6C5DD3]"
            }`}
            onClick={onToggleHistory}
          >
            {showHistory ? (
              <>
                <ArrowLeft className="size-3.5 animate-back-bounce" />
                {activeTabLabel === "Budget Units" ? "Back to Budget Units" : "Back to Programs"}
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
            className="h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
            onClick={onToggleInactiveOnly}
          >
            {inactiveOnly ? (
              <Check className="size-[11px] stroke-3 text-white" />
            ) : (
              <span className="size-[11px] rounded-[2px] bg-white" />
            )}
            Inactive
          </Button>
        )}
        {!showHistory && showAdd && (
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

