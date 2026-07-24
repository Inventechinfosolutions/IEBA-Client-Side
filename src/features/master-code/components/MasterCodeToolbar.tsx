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
    <div className="mb-2 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
      {canAdd && (
        <div className="w-full sm:w-auto">
          <Button
            type="button"
            className="w-full sm:w-auto h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3] justify-center"
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
        </div>
      )}
      <div className="w-full sm:w-auto flex items-center justify-end gap-2">
        <Button
          type="button"
          className="w-full sm:w-auto flex-1 sm:flex-none h-9 cursor-pointer gap-2 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3] justify-center"
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
            className="w-full sm:w-auto flex-1 sm:flex-none h-9 cursor-pointer gap-1 rounded-[12px] bg-[#6C5DD3] px-3 text-[12px] font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.05)] hover:bg-[#6C5DD3] justify-center"
            onClick={onAddFfp}
          >
            <Plus className="size-3.5" />
            {`Add ${codeType}`}
          </Button>
        )}
      </div>
    </div>
  )
}
