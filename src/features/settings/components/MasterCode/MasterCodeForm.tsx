import { Controller, useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown"
import { Spinner } from "@/components/ui/spinner"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { MasterCodeSelectOption } from "@/features/settings/lib/masterCodeOptions.utils"
import type { SettingsFormValues } from "@/features/settings/types"

const labelClassName = "mb-2 block text-[12px] font-normal text-[#2a2f3a]"
const selectTriggerClassName =
  "min-h-[43px] w-full sm:!w-[360px] !rounded-[8px] border border-[#d6d7dc] bg-white px-[11px] !text-[12px] text-[#111827] shadow-none"

type MasterCodeFormProps = {
  isSaving?: boolean
  clientId?: number
  options?: MasterCodeSelectOption[]
  isLoading?: boolean
}

/**
 * Master Code settings form — multi-select for county master codes.
 * Initial values come from parent `SettingsForm` via TanStack Query (no useEffect).
 */
export function MasterCodeForm({
  isSaving = false,
  clientId,
  options = [],
  isLoading = false,
}: MasterCodeFormProps) {
  const { control } = useFormContext<SettingsFormValues>()

  return (
    <div className="bg-transparent px-3 py-3 sm:px-6">
      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-10">
        <div className="w-full sm:w-[230px] pl-0">
          <label className={labelClassName}>Master Code</label>
        </div>

        <Controller
          name="masterCode.selectedMasterCodeIds"
          control={control}
          render={({ field }) => (
            <MultiSelectDropdown
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={options}
              placeholder="Select Master Codes"
              isLoading={isLoading}
              maxVisibleItems={3}
              className={selectTriggerClassName}
            />
          )}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="submit"
          data-settings-section={SettingsFormSaveSection.MasterCode}
          disabled={isSaving || !clientId}
          className="h-[44px] w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)] disabled:cursor-not-allowed"
        >
          {isSaving ? <Spinner className="text-white" /> : "Save"}
        </Button>
      </div>
    </div>
  )
}
