import { Check, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { MasterCodeToolbarProps } from "@/features/master-code/types"

export function MasterCodeToolbar({
  codeType,
  allowMultiCodes,
  inactiveOnly,
  onToggleAllowMultiCodes,
  onToggleInactiveOnly,
  onAddFfp,
  canAdd,
}: MasterCodeToolbarProps) {
  return (
    <div className="mb-2 flex items-center justify-end gap-2">
      {canAdd && (
        <Button
          type="button"
          className="h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onToggleAllowMultiCodes}
        >
          {allowMultiCodes ? (
            <span className="inline-flex size-[14px] items-center justify-center rounded-[3px] bg-white dark:bg-[#1C1C2D]">
              <Check className="size-[11px] stroke-[3] text-[#6C5DD3] dark:text-white" />
            </span>
          ) : (
            <span className="size-[13px] rounded-[3px] bg-white dark:bg-[#1C1C2D]" />
          )}
          Allow Multi Codes?
        </Button>
      )}
      <Button
        type="button"
        className="h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
        onClick={onToggleInactiveOnly}
      >
        {inactiveOnly ? (
          <span className="inline-flex size-[14px] items-center justify-center rounded-[3px] bg-white dark:bg-[#1C1C2D]">
            <Check className="size-[9px] stroke-[3] text-[#6C5DD3] dark:text-white" />
          </span>
        ) : (
          <span className="size-[13px] rounded-[3px] bg-white dark:bg-[#1C1C2D]" />
        )}
        Inactive
      </Button>
      {canAdd && (
        <Button
          type="button"
          className="h-9 cursor-pointer gap-1 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3]"
          onClick={onAddFfp}
        >
          <Plus className="size-3.5" />
          {`Add ${codeType}`}
        </Button>
      )}
    </div>
  )
}
