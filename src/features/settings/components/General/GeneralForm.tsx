import { useFormContext } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SettingsFormValues } from "@/features/settings/types"

const labelClassName = "text-[12px] font-normal text-[#2a2f3a]"
const minutesGroupClassName =
  "flex h-[30px] w-[235px] items-stretch overflow-hidden rounded-[8px] border border-[#d6d7dc] bg-white"
const minutesInputClassName =
  "h-full w-[170px] rounded-none border-0 bg-transparent px-4 pr-8 text-[14px] text-[#111827] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none " +
  "[appearance:auto] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:h-full"
const minutesStepperClassName =
  "absolute right-0 top-0 flex h-full w-[16px] flex-col divide-y divide-[#d6d7dc] border-l border-[#d6d7dc] bg-white opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
const minutesStepButtonClassName =
  "flex h-1/2 w-full items-center justify-center text-[#6b7280] hover:bg-[#f3f4f8] focus-visible:outline-none"
const minutesAddonClassName =
  "flex w-[80px] items-center justify-center border-l border-[#d6d7dc] bg-[#f3f4f8] text-[12px] font-normal text-[#111827]"

export function GeneralForm() {
  const { register, getValues, setValue } = useFormContext<SettingsFormValues>()

  const stepMinutes = (delta: 1 | -1) => {
    const currentRaw = getValues("general.screenInactivityTimeMinutes")
    const current = Number(currentRaw)
    const safeCurrent = Number.isFinite(current) ? current : 0
    const next = Math.min(9999, Math.max(1, safeCurrent + delta))
    setValue("general.screenInactivityTimeMinutes", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="bg-transparent px-2 py-3">
      <div className="space-y-3">
        <div className="flex items-center gap-6">
          <div className="w-[230px] pl-6">
            <label className={labelClassName}>Screen Inactivity Time</label>
          </div>

          <div className={minutesGroupClassName}>
            <div className="group relative">
              <Input
                type="number"
                min={1}
                step={1}
                {...register("general.screenInactivityTimeMinutes")}
                className={minutesInputClassName}
                aria-label="Screen inactivity time in minutes"
              />
              <div className={minutesStepperClassName} aria-hidden="true">
                <button
                  type="button"
                  className={minutesStepButtonClassName}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => stepMinutes(1)}
                  aria-label="Increase screen inactivity time"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  className={minutesStepButtonClassName}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => stepMinutes(-1)}
                  aria-label="Decrease screen inactivity time"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>
            <div className={minutesAddonClassName}>Minutes</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="h-[44px] w-[88px] rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

