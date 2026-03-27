import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { JobPoolToolbarProps } from "../types"

export function JobPoolToolbar({
  searchValue,
  inactiveOnly,
  onSearchChange,
  onToggleInactiveOnly,
  onAdd,
}: JobPoolToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Input
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search here"
        className="h-[50px] w-[270px] rounded-[10px] border border-[#d0d5df] bg-white px-3.5 text-[11px] text-[#111827] shadow-[0_4px_10px_rgba(15,23,42,0.08)] placeholder:text-[10px] placeholder:text-[#a7afbf] focus-visible:border-[#6C5DD3] focus-visible:ring-1 focus-visible:ring-[#6C5DD333]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          className="h-11 cursor-pointer gap-2 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onToggleInactiveOnly}
        >
          {inactiveOnly ? (
            <Check className="size-[11px] stroke-[3] text-white" />
          ) : (
            <span className="size-[11px] rounded-[2px] bg-white" />
          )}
          Inactive
        </Button>
        <Button
          type="button"
          className="h-11 cursor-pointer gap-1 rounded-[10px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onAdd}
        >
          <Plus className="size-3.5" />
          Add Job Pool
        </Button>
      </div>
    </div>
  )
}

