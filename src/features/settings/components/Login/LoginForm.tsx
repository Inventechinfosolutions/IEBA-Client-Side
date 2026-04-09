import { Controller, useFormContext } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsFormValues } from "@/features/settings/types"

const labelClassName = "text-[12px] font-normal text-[#2a2f3a]"
const otpGroupClassName =
  "flex h-[30px] w-[235px] items-stretch overflow-hidden rounded-[8px] border border-[#d6d7dc] bg-white"
const otpInputClassName =
  "h-full w-[170px] rounded-none border-0 bg-transparent px-4 pr-8 text-[14px] text-[#111827] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none " +
  "[appearance:auto] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:h-full"
const otpStepperClassName =
  "absolute right-0 top-0 flex h-full w-[16px] flex-col divide-y divide-[#d6d7dc] border-l border-[#d6d7dc] bg-white opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
const otpStepButtonClassName =
  "flex h-1/2 w-full cursor-pointer items-center justify-center text-[#6b7280] hover:bg-[#f3f4f8] focus-visible:outline-none"
const otpAddonClassName =
  "flex w-[80px] items-center justify-center border-l border-[#d6d7dc] bg-white text-[12px] font-normal text-[#111827]"

export function LoginForm() {
  const { control, register, getValues, setValue } = useFormContext<SettingsFormValues>()

  const stepOtpTimer = (delta: 1 | -1) => {
    const currentRaw = getValues("login.otpValidationTimerSeconds")
    const current = Number(currentRaw)
    const safeCurrent = Number.isFinite(current) ? current : 0
    const next = Math.min(9999, Math.max(1, safeCurrent + delta))
    setValue("login.otpValidationTimerSeconds", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  return (
    <div className="bg-transparent px-6 py-3">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-20">
            <div className="w-[230px] pl-0">
              <label className={labelClassName}>Two-Factor Authentication</label>
            </div>
            <Controller
              name="login.twoFactorAuthentication"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  className="size-[14px] border-[#cfd6e4] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:border-[var(--primary)]"
                  aria-label="Toggle two-factor authentication"
                />
              )}
            />
          </div>

          <div className="flex items-center gap-20">
            <div className="w-[230px] pl-6">
              <label className={labelClassName}>OTP Validation Timer</label>
            </div>
            <div className={otpGroupClassName}>
              <div className="group relative">
                <Input
                  type="number"
                  min={1}
                  step={1}
                  {...register("login.otpValidationTimerSeconds")}
                  className={otpInputClassName}
                  aria-label="OTP validation timer in seconds"
                />
                <div className={otpStepperClassName} aria-hidden="true">
                  <button
                    type="button"
                    className={otpStepButtonClassName}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => stepOtpTimer(1)}
                    aria-label="Increase OTP validation timer"
                  >
                    <ChevronUp className="size-2" />
                  </button>
                  <button
                    type="button"
                    className={otpStepButtonClassName}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => stepOtpTimer(-1)}
                    aria-label="Decrease OTP validation timer"
                  >
                    <ChevronDown className="size-2" />
                  </button>
                </div>
              </div>
              <div className={otpAddonClassName}>Seconds</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            data-settings-section={SettingsFormSaveSection.Login}
            className="h-[44px] w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

