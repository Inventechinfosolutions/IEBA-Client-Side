import { useFormContext } from "react-hook-form"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { useAuth } from "@/contexts/AuthContext"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import { useRunA010MonthlySnapshot } from "@/features/settings/mutations/runA010MonthlySnapshot"
import type { SettingsFormValues } from "@/features/settings/types"
import { usePermissions } from "@/hooks/usePermissions"
import { AppLogout } from "./AppLogout"

const labelClassName = "text-[12px] font-normal text-[#2a2f3a]"
const minutesGroupClassName =
  "flex h-[30px] w-[235px] items-stretch overflow-hidden rounded-[8px] border border-[#d6d7dc] bg-white"
const minutesInputClassName =
  "h-full w-[170px] rounded-none border-0 bg-transparent px-4 pr-8 text-[14px] text-[#111827] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none " +
  "[appearance:auto] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:h-full"
const minutesStepperClassName =
  "absolute right-0 top-0 flex h-full w-[16px] flex-col divide-y divide-[#d6d7dc] border-l border-[#d6d7dc] bg-white opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto"
const minutesStepButtonClassName =
  "flex h-1/2 w-full cursor-pointer items-center justify-center text-[#6b7280] hover:bg-[#f3f4f8] focus-visible:outline-none"
const minutesAddonClassName =
  "flex w-[80px] items-center justify-center border-l border-[#d6d7dc] bg-white text-[12px] font-normal text-[#111827]"

/**
 * GeneralForm component for managing general application settings.
 * Rules followed: 
 * - No useEffect used (initial values handled via parent form utils).
 * - TanStack Query for saving (useUpdateInactivityTime).
 * - Zod validation via useFormContext.
 */
export function GeneralForm({ isSaving = false }: { isSaving?: boolean }) {
  const { register, getValues, setValue } = useFormContext<SettingsFormValues>()
  const { user } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const canRunA010Snapshot = isSuperAdmin || user?.pki === true
  const a010Snapshot = useRunA010MonthlySnapshot()

  const stepMinutesAction = (delta: 1 | -1) => {
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
    <div className="bg-transparent px-3 py-3 sm:px-6">
      {/* Keeping AppLogout under generalForm logic as requested */}
      <AppLogout />

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-10">
          <div className="w-full sm:w-[230px] pl-0">
            <label className={labelClassName}>Screen Inactivity Time</label>
          </div>

          <div className={minutesGroupClassName}>
            <div className="group relative">
              <TitleCaseInput
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
                  onClick={() => stepMinutesAction(1)}
                  aria-label="Increase screen inactivity time"
                >
                  <ChevronUp className="size-3" />
                </button>
                <button
                  type="button"
                  className={minutesStepButtonClassName}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => stepMinutesAction(-1)}
                  aria-label="Decrease screen inactivity time"
                >
                  <ChevronDown className="size-3" />
                </button>
              </div>
            </div>
            <div className={minutesAddonClassName}>Minutes</div>
          </div>
        </div>

        {canRunA010Snapshot ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-10 border-t border-[#f0f0f0] pt-3">
            <div className="w-full sm:w-[230px] pl-0">
              <label className={labelClassName}>A010 monthly snapshot</label>
              <p className="mt-1 text-[11px] leading-snug text-[#6b7280]">
                Insert current active users into A010 for this month (same as the automatic 1st-of-month job).
              </p>
            </div>
            <Button
              type="button"
              disabled={a010Snapshot.isPending}
              onClick={() => a010Snapshot.mutate()}
              className="h-[36px] min-w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-4 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
            >
              {a010Snapshot.isPending ? <Spinner className="text-white" /> : "Run"}
            </Button>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            data-settings-section={SettingsFormSaveSection.General}
            disabled={isSaving}
            className="h-[44px] w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)]"
          >
            {isSaving ? <Spinner className="text-white" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
