import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { useState } from "react"
import { Clock, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import type { SettingsFormValues } from "@/features/settings/types"
import { CountyAddressRow } from "@/features/settings/components/Country/CountyAddressRow"
import defaultCountyAvatar from "@/assets/county-avatar.png"

const labelClassName = "mb-1 block select-none text-[14px] font-medium text-[#2a2f3a]"
const sectionHeadingClassName = "mb-2 text-[18px] font-black text-[var(--primary)]"
const inputClassName =
  "h-[49px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[14px] text-[#1f2937] shadow-none placeholder:text-[14px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#cfc6ff] focus-visible:ring-0"
const timeInputClassName =
  `${inputClassName} h-[49px] w-[98px] pl-9 pr-9 text-center bg-[#f3f4f8] cursor-text ` +
  `[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none`
const timeInputDisabledClassName =
  `${inputClassName} h-[49px] w-[98px] pl-3 pr-3 text-center bg-[#f3f4f8] cursor-not-allowed disabled:cursor-not-allowed disabled:opacity-100 disabled:text-[#111827] ` +
  `[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:pointer-events-none`

function RequiredLabel({ children }: { children: string }) {
  return (
    <span className="text-[14px] font-medium text-[var(--primary)]">
      <span className="text-[#ef4444]">*</span>
      {children}
    </span>
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  const reader = new FileReader()
  return await new Promise((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

export function CountyForm({ isSaving }: { isSaving: boolean }) {
  const { control, register, watch, setValue } = useFormContext<SettingsFormValues>()
  const logoDataUrl = watch("county.logoDataUrl")
  const [isTimeRangeEnabled, setIsTimeRangeEnabled] = useState(false)
  const startTime2Value = watch("county.startTime2")
  const endTimeValue = watch("county.endTime")

  const addresses = useFieldArray({
    control,
    name: "county.addresses",
  })

  const handleAddAddressRow = () => {
    if (addresses.fields.length >= 4) return
    addresses.append({ location: "", street: "", city: "", state: "", zip: "" })
  }

  return (
    <div className="space-y-3">
      {/* Row 1: profile/logo */}
      <div>
        <label className="mb-1 block select-none text-[14px] font-medium text-[#111827]">
          <span className="text-[#ef4444]">*</span>County Logo
        </label>
        <div className="mt-2">
          <div className="relative w-fit">
            <div className="size-[160px] overflow-hidden rounded-full bg-white shadow-[0_8px_30px_rgba(17,24,39,0.08)]">
              <img
                src={logoDataUrl ?? defaultCountyAvatar}
                alt="County logo"
                className="h-full w-full object-cover"
              />
            </div>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Upload county logo"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const dataUrl = await readFileAsDataUrl(file)
                setValue("county.logoDataUrl", dataUrl, { shouldDirty: true })
              }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: all fields/toggles in one line */}
      <div className="grid max-w-[calc(100%-112px)] grid-cols-[145px_200px_auto_auto_auto_auto_auto] items-start gap-5">
        <div>
          <label className={labelClassName}>
            <span className="text-[14px] font-medium text-[#111827]">
              <span className="text-[#ef4444]">*</span>
              County Name
            </span>
          </label>
          <Input {...register("county.countyName")} className={inputClassName} />
        </div>
        <div>
          <label className={labelClassName}>Welcome Message</label>
          <Input
            {...register("county.welcomeMessage")}
            className={inputClassName}
            placeholder="Welcome message"
          />
        </div>

        <div>
          <label className={labelClassName}>
            <RequiredLabel>Start Time</RequiredLabel>
          </label>
          {/* Keep startTime1 in the form model for validation/payload, but UI uses a toggle */}
          <input type="hidden" {...register("county.startTime1")} />
          <div className="flex justify-center pt-2">
            <Switch
              checked={isTimeRangeEnabled}
              onCheckedChange={(checked) => setIsTimeRangeEnabled(checked)}
              className="cursor-pointer data-checked:bg-[var(--primary)]"
            />
          </div>
        </div>
        <div>
          <label className={labelClassName}>
            <RequiredLabel>Start Time</RequiredLabel>
          </label>
          {isTimeRangeEnabled ? (
            <div className="relative w-[98px]">
              <Input
                type="time"
                {...register("county.startTime2")}
                className={timeInputClassName}
              />
              <Clock className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
            </div>
          ) : (
            <div className="relative w-[98px] cursor-not-allowed">
              <Input
                type="text"
                disabled
                value={startTime2Value ?? ""}
                className={timeInputDisabledClassName}
                readOnly
              />
              <Clock className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
            </div>
          )}
        </div>
        <div>
          <label className={labelClassName}>
            <RequiredLabel>End Time</RequiredLabel>
          </label>
          <div className="relative w-[98px] cursor-not-allowed">
            <Input
              type="text"
              disabled
              value={endTimeValue ?? ""}
              className={timeInputDisabledClassName}
              readOnly
            />
            <Clock className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
          </div>
        </div>

        <div>
          <label className={`${labelClassName} mb-4 text-center`}>
            <RequiredLabel>Auto Approval</RequiredLabel>
          </label>
          <Controller
            name="county.autoApproval"
            control={control}
            render={({ field }) => (
              <div className="flex justify-center">
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  className="cursor-pointer data-checked:bg-[var(--primary)]"
                />
              </div>
            )}
          />
        </div>
        <div>
          <label className={`${labelClassName} mb-4 text-center`}>
            <RequiredLabel>Supervisor Apportioning</RequiredLabel>
          </label>
          <Controller
            name="county.supervisorApportioning"
            control={control}
            render={({ field }) => (
              <div className="flex justify-center">
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  className="cursor-pointer data-checked:bg-[var(--primary)]"
                />
              </div>
            )}
          />
        </div>
      </div>

      {/* Row 3: Include Weekends */}
      <div className="w-fit">
        <div className="inline-flex flex-col items-center gap-4">
          <label className={labelClassName}>
            <RequiredLabel>Include Weekends</RequiredLabel>
          </label>
          <Controller
            name="county.includedWeekends"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked)}
                className="cursor-pointer data-checked:bg-[var(--primary)]"
              />
            )}
          />
        </div>
      </div>

      <div className="relative mt-9">
        <div className="mb-3">
          <div className="flex items-center justify-between max-w-[calc(100%-160px)]">
            <div className={sectionHeadingClassName}>County Address</div>
            {addresses.fields.length < 4 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddAddressRow}
                className="size-8 cursor-pointer rounded-[4px] border-2 border-[var(--primary)] bg-white text-[var(--primary)] hover:bg-white hover:border-[var(--primary)] hover:text-[var(--primary)]"
                aria-label="Add address row"
              >
                <Plus className="size-3.5" strokeWidth={3} />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-2.5">
          {addresses.fields.map((field, index) => (
            <CountyAddressRow
              key={field.id}
              index={index}
              canRemove={index > 0}
              onRemove={() => addresses.remove(index)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end max-w-[calc(100%-80px)]">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-[45px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-6 text-[16px] font-medium text-white hover:bg-[var(--primary)] disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}

