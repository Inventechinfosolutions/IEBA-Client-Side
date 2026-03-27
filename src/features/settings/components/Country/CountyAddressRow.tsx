import { Trash2 } from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
}: CountyAddressRowProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SettingsFormValues>()

  void errors.county?.addresses?.[index]

  return (
    <div className="grid max-w-[calc(100%-160px)] grid-cols-[0.5fr_0.9fr_0.55fr_0.35fr_0.5fr_auto] items-end gap-4">
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Location
        </label>
        <Input
          {...register(`county.addresses.${index}.location` as const)}
          className={inputClassName}
          placeholder="Location"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Street
        </label>
        <Input
          {...register(`county.addresses.${index}.street` as const)}
          className={inputClassName}
          placeholder="Street"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>City
        </label>
        <Input
          {...register(`county.addresses.${index}.city` as const)}
          className={inputClassName}
          placeholder="City"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>State
        </label>
        <Input
          {...register(`county.addresses.${index}.state` as const)}
          className={inputClassName}
          placeholder="State"
        />
      </div>
      <div>
        <label className={labelClassName}>
          <span className="text-[#ef4444]">*</span>Zip
        </label>
        <Input
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
            className="size-8 cursor-pointer rounded-[4px] text-[#ff0000] hover:bg-transparent hover:text-[#ff0000]"
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


