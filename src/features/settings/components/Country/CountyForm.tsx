import { Controller, useFieldArray, useFormContext } from "react-hook-form"
import { Clock, Plus } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Switch } from "@/components/ui/switch"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsFormValues } from "@/features/settings/types"
import { CountyAddressRow } from "@/features/settings/components/Country/CountyAddressRow"
import { TimeSelectionUI } from "@/features/settings/components/TimeSelectionUI/TimeSelectionUI"
import defaultCountyAvatar from "@/assets/county-avatar.png"
import { ImageCropUploadDialog } from "@/features/Profile/components/ImageCropUploadDialog"
import type { CountyFormProps, RequiredLabelProps } from "./types"
import { parseLocationId } from "@/features/settings/components/Country/locationUtils"
import { useDeleteCountyLocation } from "@/features/settings/mutations/deleteCountyLocation"
import { deleteCountyLogo } from "@/features/settings/components/Country/api"
import { settingsCountyClientQueryKey } from "@/features/settings/queries/getCountyClient"

const labelClassName =
  "mb-1 block select-none text-[12px] font-normal text-[#2a2f3a] lg:min-h-[2.75rem]"
const sectionHeadingClassName = "mb-2 text-[14px] font-black text-[var(--primary)]"
/** Matches reference layout: name, wide welcome, time toggle, start, end, two toggles — one row; weekends under col 1. */
const countyFieldsGridClassName =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,2.1fr)_minmax(0,5.5rem)_minmax(0,6.25rem)_minmax(0,6.25rem)_minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start lg:gap-x-4 lg:gap-y-4"
const controlRowClassName = "flex h-[49px] items-center"
const inputClassName =
  "h-[49px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[12px] text-[#1f2937] shadow-none placeholder:text-[12px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
const timeInputDisabledClassName =
  `${inputClassName} h-[49px] w-full pl-3 pr-9 text-center tabular-nums bg-[#f2f2f2] cursor-not-allowed disabled:cursor-not-allowed disabled:opacity-100 disabled:text-[#111827] ` +
  `[&::-webkit-calendar-picker-indicator]:opacity-0`

function RequiredLabel({ children }: RequiredLabelProps) {
  return (
    <span className="text-[12px] font-normal text-[var(--primary)]">
      <span className="text-[#ef4444]">*</span>
      {children}
    </span>
  )
}

export function CountyForm({ isSaving }: CountyFormProps) {
  const { control, register, watch, setValue, getValues } = useFormContext<SettingsFormValues>()
  const queryClient = useQueryClient()
  const logoDataUrl = watch("county.logoDataUrl")
  const isTimeRangeEnabled = watch("county.isTimeRangeEnabled")
  const endTimeValue = watch("county.endTime")
  const startTime2Value = watch("county.startTime2")

  const deleteLocationMutation = useDeleteCountyLocation()

  const addresses = useFieldArray({
    control,
    name: "county.addresses",
  })

  const handleAppendAddressRow = () => {
    if (addresses.fields.length >= 4) return
    addresses.append({
      locationId: undefined,
      location: "",
      street: "",
      city: "",
      state: "",
      zip: "",
    })
  }

  const handleRemoveAddressRowByIndex = (index: number) => {
    const id = parseLocationId(getValues(`county.addresses.${index}.locationId`))
    if (id !== undefined) {
      deleteLocationMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Deleted successfully")
          addresses.remove(index)
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Delete failed")
        },
      })
      return
    }
    addresses.remove(index)
  }

  return (
    <div className="bg-transparent px-3 py-3 sm:px-6">
      <div className="flex flex-col gap-6">
        {/* Logo first; all fields and address below */}
        <div className="w-full">
          <label className="mb-1 block select-none text-[12px] font-normal text-[#111827]">
            <span className="text-[#ef4444]">*</span>County Logo
          </label>
          <ImageCropUploadDialog
            title="County Logo Update"
            initialImageSrc={logoDataUrl ?? null}
            onDeleteImage={async () => {
              const cached = queryClient.getQueriesData({ queryKey: settingsCountyClientQueryKey })
              const first = cached.find(([, data]) => Boolean(data))?.[1] as { id?: number } | undefined
              if (first?.id) {
                await deleteCountyLogo(first.id)
              }
              setValue("county.logoDataUrl", null, { shouldDirty: true })
              toast.success("County logo removed")
            }}
            onImageCropped={(cropped) => {
              setValue("county.logoDataUrl", cropped, { shouldDirty: true })
            }}
            renderTrigger={({ openDialog }) => (
              <div className="mt-2">
                <div className="relative w-fit">
                  <div className="size-[160px] overflow-hidden rounded-full bg-white shadow-[0_8px_30px_rgba(17,24,39,0.08)]">
                    <img
                      src={logoDataUrl || defaultCountyAvatar}
                      alt="County logo"
                      className="h-full w-full cursor-pointer object-cover"
                      role="button"
                      tabIndex={0}
                      onClick={openDialog}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDialog()
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        <div className="min-w-0 w-full space-y-4">
          <div className={countyFieldsGridClassName}>
            <div className="min-w-0 sm:col-span-1">
              <label className={labelClassName}>
                <span className="text-[12px] font-normal text-[#111827]">
                  <span className="text-[#ef4444]">*</span>
                  County Name
                </span>
              </label>
              <TitleCaseInput {...register("county.countyName")} className={inputClassName} />
            </div>

            <div className="min-w-0 sm:col-span-1 lg:col-span-1">
              <label className={labelClassName}>Welcome Message</label>
              <TitleCaseInput
                {...register("county.welcomeMessage")}
                className={inputClassName}
                placeholder="Welcome message"
              />
            </div>

            <div className="min-w-0">
              <label className={labelClassName}>
                <RequiredLabel>Start Time</RequiredLabel>
              </label>
              <TitleCaseInput type="hidden" {...register("county.startTime1")} />
              <div className={controlRowClassName}>
                <Controller
                  name="county.isTimeRangeEnabled"
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

            <div className="min-w-0">
              <label className={labelClassName}>
                <RequiredLabel>Start Time</RequiredLabel>
              </label>
              <TimeSelectionUI
                disabled={!isTimeRangeEnabled}
                value={startTime2Value ?? ""}
                onValueChange={(next) => setValue("county.startTime2", next, { shouldDirty: true })}
                inputWidthClassName="w-[100px]"
                dropdownWidthClassName="w-[155px]"
              />
            </div>

            <div className="min-w-0">
              <label className={labelClassName}>
                <RequiredLabel>End Time</RequiredLabel>
              </label>
              <div className="relative w-[100px] cursor-not-allowed">
                <TitleCaseInput
                  type="text"
                  disabled
                  value={endTimeValue ?? "00:00"}
                  className={timeInputDisabledClassName}
                  readOnly
                />
                <Clock className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-[#9ca3af]" />
              </div>
            </div>

            <div className="min-w-0">
              <label className={labelClassName}>
                <RequiredLabel>Auto Approval</RequiredLabel>
              </label>
              <div className={controlRowClassName}>
                <Controller
                  name="county.autoApproval"
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

            <div className="min-w-0">
              <label className={labelClassName}>
                <RequiredLabel>Supervisor Apportioning</RequiredLabel>
              </label>
              <div className={controlRowClassName}>
                <Controller
                  name="county.supervisorApportioning"
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

            {/* Row 2: under County Name only */}
            <div className="min-w-0 lg:col-span-1">
              <label className={labelClassName}>
                <RequiredLabel>Include Weekends</RequiredLabel>
              </label>
              <div className={controlRowClassName}>
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
          </div>

          <div className="relative mt-6">
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <div className={sectionHeadingClassName}>County Address</div>
                {addresses.fields.length < 4 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAppendAddressRow}
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
                  onRemove={() => handleRemoveAddressRowByIndex(index)}
                  removeDisabled={deleteLocationMutation.isPending}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                data-settings-section={SettingsFormSaveSection.County}
                disabled={isSaving}
                className="h-[44px] w-[88px] cursor-pointer rounded-[10px] bg-[var(--primary)] px-0 py-2 text-[14px] font-medium text-white hover:bg-[var(--primary)] disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


