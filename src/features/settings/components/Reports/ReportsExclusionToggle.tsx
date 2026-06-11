import { Controller, type Control } from "react-hook-form"

import { Switch } from "@/components/ui/switch"
import type { SettingsFormValues } from "@/features/settings/types"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"

export function ReportsExclusionToggle({
  control,
  disabled = false,
  onExclusionModeChange,
}: {
  control: Control<SettingsFormValues>
  disabled?: boolean
  onExclusionModeChange: (checked: boolean) => void
}) {
  return (
    <div className="flex flex-col">
      <label className={labelClassName}>Exclusion/Inclusion</label>
      <div className="mt-[10px] flex items-center gap-3">
        <Controller
          name="reports.masterCodeExclusionMode"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value === "include"}
              disabled={disabled}
              onCheckedChange={onExclusionModeChange}
              className="data-checked:bg-[var(--primary)]"
            />
          )}
        />
      </div>
    </div>
  )
}
