import { ChevronDown, ChevronUp, Play } from "lucide-react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Purple control, no border; white triangle icons at size-3. */
const transferListMoveButtonClass =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5DD3]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#6C5DD3] disabled:text-white disabled:hover:brightness-100 disabled:active:scale-100"

export type TransferListMoveButtonProps = ComponentProps<"button"> & {
  /** Toward the assigned (right) column. */
  direction: "forward" | "back"
}

/**
 * Purple square, borderless — white triangle (`Play`) dual-list control (Security, Time Study, etc.).
 * On mobile (row layout): shows ChevronDown (forward) / ChevronUp (back).
 * On sm+ (column layout): shows Play pointing right / left.
 */
export function TransferListMoveButton({
  direction,
  className,
  disabled,
  "aria-label": ariaLabel,
  ...props
}: TransferListMoveButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(transferListMoveButtonClass, className)}
      {...props}
    >
      {/* Mobile/Stacked: up/down arrows */}
      {direction === "forward" ? (
        <ChevronDown
          className="block lg:hidden size-5 shrink-0 fill-white stroke-white stroke-[1.5]"
          aria-hidden
        />
      ) : (
        <ChevronUp
          className="block lg:hidden size-5 shrink-0 fill-white stroke-white stroke-[1.5]"
          aria-hidden
        />
      )}
      {/* Desktop side-by-side: left/right play triangles */}
      <Play
        className={cn(
          "hidden lg:block size-3 shrink-0 fill-white stroke-white stroke-[1.25]",
          direction === "back" && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  )
}
