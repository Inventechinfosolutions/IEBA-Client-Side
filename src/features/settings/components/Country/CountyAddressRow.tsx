import { Trash2 } from "lucide-react"
import { Controller, useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import type { SettingsFormValues } from "@/features/settings/types"
import type { CountyAddressRowProps } from "./types"

const labelClassName =
  "mb-1 block select-none text-[14px] font-medium text-[var(--primary)]"
const inputClassName =
  "h-[49px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[14px] text-[#1f2937] shadow-none placeholder:text-[14px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0"

export function CountyAddressRow({
  index,
  onRemove,
  canRemove,
  removeDisabled = false,
}: CountyAddressRowProps) {
  const { control, register } = useFormContext<SettingsFormValues>()

  return (
    <div className="grid w-full grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)_minmax(0,0.75fr)_minmax(0,0.45fr)_minmax(0,0.55fr)_auto] items-end gap-x-4 gap-y-2">
      <Controller
        control={control}
        name={`county.addresses.${index}.locationId`}
        render={({ field }) => (
          <TitleCaseInput
            type="hidden"
            name={field.name}
            ref={field.ref}
            value={field.value === undefined || field.value === null ? "" : String(field.value)}
            onChange={(e) => {
              const raw = e.target.value
              field.onChange(raw === "" ? undefined : Number(raw))
            }}
          />
        )}
      />
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Location
        </label>
        <TitleCaseInput
          {...register(`county.addresses.${index}.location` as const)}
          className={inputClassName}
          placeholder="Location"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Street
        </label>
        <TitleCaseInput
          {...register(`county.addresses.${index}.street` as const)}
          className={inputClassName}
          placeholder="Street"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>City
        </label>
        <TitleCaseInput
          {...register(`county.addresses.${index}.city` as const)}
          className={inputClassName}
          placeholder="City"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>State
        </label>
        <TitleCaseInput
          {...register(`county.addresses.${index}.state` as const)}
          className={inputClassName}
          placeholder="State"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Zip
        </label>
        <TitleCaseInput
          {...register(`county.addresses.${index}.zip` as const)}
          className={inputClassName}
          placeholder="Zip"
        />
      </div>
      <div className="pb-[2px]">
        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={removeDisabled}
            className="size-8 cursor-pointer rounded-[4px] text-[#ff0000] hover:bg-transparent hover:text-[#ff0000] disabled:opacity-50"
            aria-label="Remove address row"
          >
            <Trash2 className="size-4" />
          </Button>
        ) : (
          <div className="size-8" />
        )}
      </div>
    </div>
  )
}


