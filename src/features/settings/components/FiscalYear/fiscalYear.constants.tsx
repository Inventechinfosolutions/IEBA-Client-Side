import { X } from "lucide-react"

export const FISCAL_YEAR_ERROR_TOAST_OPTIONS = {
  position: "top-center" as const,
  icon: (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
      <X className="size-3 stroke-[2.5]" />
    </span>
  ),
}

export const FISCAL_YEAR_SUCCESS_TOAST_CLASSNAME =
  "!w-fit !max-w-none !min-h-[35px] !rounded-[6px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]"
