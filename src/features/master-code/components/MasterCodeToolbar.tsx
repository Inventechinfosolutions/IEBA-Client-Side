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
            <Check className="size-[11px] stroke-3 text-white" />
          ) : (
            <span className="size-[11px] rounded-[2px] bg-white" />
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
          <Check className="size-[11px] stroke-3 text-white" />
        ) : (
          <span className="size-[11px] rounded-[2px] bg-white" />
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
