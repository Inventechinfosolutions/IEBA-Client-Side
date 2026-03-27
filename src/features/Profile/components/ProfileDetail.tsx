import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Controller, useForm, type FieldErrors } from "react-hook-form"
import { useMemo, useState } from "react"

import profileAvatar from "@/assets/profile-avatar.png"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"
import { profileDetailDefaultValues, profileDetailFormSchema } from "@/features/Profile/schemas"
import { ImageCropUploadDialog } from "@/features/Profile/components/ImageCropUploadDialog"
import type {
  ProfileDetailFormValues,
  Relationship,
} from "@/features/Profile/types"
import { RELATIONSHIP_OPTIONS } from "@/features/Profile/types"
import { useGetProfileDetail } from "@/features/Profile/queries/getProfileDetail"
import { useUpdateProfileDetail } from "@/features/Profile/mutations/updateProfileDetail"

function getFirstErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null

  const record = value as Record<string, unknown>
  if (typeof record.message === "string" && record.message) return record.message

  for (const nested of Object.values(record)) {
    const message = getFirstErrorMessage(nested)
    if (message) return message
  }

  return null
}

function formatPhone(value: string): string {
  const digits = value.replaceAll(/\D/g, "").slice(0, 10)
  let formatted = digits

  if (digits.length > 3 && digits.length <= 6) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`
  } else if (digits.length > 6) {
    formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  return formatted
}

const inputClassName =
  "h-[58px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 py-0 text-[12px] leading-[12px] text-[#1f2937] shadow-none placeholder:text-[12px] placeholder:font-normal placeholder:text-[#c2c7d3] hover:border-[#8f86f0] focus-visible:border-[#8f86f0] focus-visible:ring-1 focus-visible:ring-[#8f86f033]"

const labelClassName = "mb-1 block text-[14px] font-normal text-[#2a2f3a]"

const selectTriggerClassName =
  "w-full !h-[58px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 !py-0 text-[12px] leading-[12px] text-[#1f2937] shadow-none focus-visible:border-[#3b82f6] focus-visible:ring-1 focus-visible:ring-[#3b82f640] data-[state=open]:border-[#3b82f6] data-[state=open]:ring-1 data-[state=open]:ring-[#3b82f640]"

const profilePicClassName =
  "h-[180px] w-[180px] rounded-full shadow-[0_0_20px_0_#0000001a] cursor-pointer object-cover"

function ProfileDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-8">
        <Skeleton className="size-[122px] rounded-full" />
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <Skeleton className="h-[44px] rounded-[7px]" />
            <Skeleton className="h-[44px] rounded-[7px]" />
            <Skeleton className="h-[44px] rounded-[7px]" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-[44px] rounded-[7px]" />
            <Skeleton className="h-[44px] rounded-[7px]" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-[160px]" />
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[44px] rounded-[7px]" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-[120px]" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[44px] rounded-[7px]" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[44px] rounded-[7px]" />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-[100px] rounded-[8px]" />
        <Skeleton className="h-9 w-[100px] rounded-[8px]" />
      </div>
    </div>
  )
}

function ProfileDetailForm({
  initialValues,
  onSubmit,
  onCancel,
  isSaving,
}: {
  initialValues: ProfileDetailFormValues
  onSubmit: (values: ProfileDetailFormValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}) {
  const [jobDutyViewOpen, setJobDutyViewOpen] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string>(profileAvatar)

  const methods = useForm<ProfileDetailFormValues>({
    resolver: zodResolver(profileDetailFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  })

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = methods

  const handleInvalidSubmit = (formErrors: FieldErrors<ProfileDetailFormValues>) => {
    const message = getFirstErrorMessage(formErrors) ?? "Please check the form fields."
    toast.error(message, {
      position: "top-center",
      className:
        "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[11px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  }

  const handleCancel = () => {
    reset(initialValues)
    onCancel()
  }

  const handleSave = handleSubmit(
    (values) => onSubmit(values),
    handleInvalidSubmit
  )

  const jobDutyStatement = watch("onRecords.jobDutyStatement")

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-start gap-8">
          <ImageCropUploadDialog
            title="Profile Update"
            onConfirmWithoutImage={() => {
              toast.error("Please choose a file.", { position: "top-center" })
            }}
            onCropError={() => {
              toast.error("Unable to crop image. Please try another file.", { position: "top-center" })
            }}
            onImageCropped={(cropped) => {
              setAvatarSrc(cropped)
              toast.success("Profile image updated.", { position: "top-center" })
            }}
            renderTrigger={({ openDialog }) => (
              <div className="mt-2 flex h-[200px] w-[200px] items-center justify-center rounded-full bg-white">
                <Avatar
                  className={profilePicClassName}
                  role="button"
                  tabIndex={0}
                  onClick={openDialog}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openDialog()
                  }}
                >
                  <AvatarImage src={avatarSrc} alt="Profile picture" className={profilePicClassName} />
                  <AvatarFallback>
                    <UserRound className="size-10 text-[#6C5DD3]" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          />

          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className={labelClassName}>
                  *First Name
                </label>
                <Input
                  {...register("firstName")}
                  className={errors.firstName ? `${inputClassName} border-[#ef4444]` : inputClassName}
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className={labelClassName}>MI</label>
                <Input {...register("mi")} className={inputClassName} placeholder="" />
              </div>
              <div>
                <label className={labelClassName}>*Last Name</label>
                <Input
                  {...register("lastName")}
                  className={errors.lastName ? `${inputClassName} border-[#ef4444]` : inputClassName}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelClassName}>Area Code</label>
                <Input
                  {...register("areaCode")}
                  className={errors.areaCode ? `${inputClassName} border-[#ef4444]` : inputClassName}
                 
                />
              </div>
              <div>
                <label className={labelClassName}>Telephone Number</label>
                <Controller
                  name="telephoneNumber"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      className={
                        errors.telephoneNumber
                          ? `${inputClassName} border-[#ef4444]`
                          : inputClassName
                      }
                      placeholder="____-____-____"
                      inputMode="numeric"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-[#6C5DD3]">
              Emergency Contact
            </h2>
            <div className="h-px flex-1 bg-[#e6e7ef]" aria-hidden />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className={labelClassName}>*First Name</label>
              <Input
                {...register("emergencyContact.firstName")}
                className={
                  errors.emergencyContact?.firstName
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="First Name"
              />
            </div>
            <div>
              <label className={labelClassName}>Last Name</label>
              <Input
                {...register("emergencyContact.lastName")}
                className={
                  errors.emergencyContact?.lastName ? `${inputClassName} border-[#ef4444]` : inputClassName
                }
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className={labelClassName}>Area Code</label>
              <Input
                {...register("emergencyContact.areaCode")}
                className={
                  errors.emergencyContact?.areaCode
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="___"
              />
            </div>
            <div>
              <label className={labelClassName}>Telephone Number</label>
              <Controller
                name="emergencyContact.telephoneNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    className={
                      errors.emergencyContact?.telephoneNumber
                        ? `${inputClassName} border-[#ef4444]`
                        : inputClassName
                    }
                    placeholder="___-___-____"
                    inputMode="numeric"
                  />
                )}
              />
            </div>
            <div>
              <label className={labelClassName}>Relationship</label>
              <Controller
                name="emergencyContact.relationship"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(next) => field.onChange(next as Relationship)}
                  >
                    <SelectTrigger className={selectTriggerClassName}>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      sideOffset={10}
                      align="start"
                      avoidCollisions={false}
                      className="w-[--radix-select-trigger-width] rounded-[10px] border border-[#e4e7ef] bg-white p-1 shadow-[0_18px_40px_rgba(0,0,0,0.16)]"
                    >
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt}
                          value={opt}
                          className="px-3 py-1.5 text-[14px] leading-5 text-[#111827] focus:bg-[#dbeafe] focus:text-[#111827] data-[state=checked]:bg-[#dbeafe] data-[state=checked]:font-semibold [&>span:first-child]:hidden"
                        >
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-[#6C5DD3]">
              On Records
            </h2>
            <div className="h-px flex-1 bg-[#e6e7ef]" aria-hidden />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClassName}>Employee ID</label>
              <Input
                {...register("onRecords.employeeId")}
                className={
                  errors.onRecords?.employeeId
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Employee ID"
              />
            </div>
            <div>
              <label className={labelClassName}>*Position ID</label>
              <Input
                {...register("onRecords.positionId")}
                className={
                  errors.onRecords?.positionId
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Position ID"
              />
            </div>
            <div>
              <label className={labelClassName}>Job Classification</label>
              <Input
                {...register("onRecords.jobClassification")}
                className={
                  errors.onRecords?.jobClassification
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Job Classification"
              />
            </div>
            <div>
              <label className={labelClassName}>Job Duty Statement</label>
              <div className="mt-1 flex items-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setJobDutyViewOpen(true)}
                  className="h-auto p-0 text-[12px] font-medium text-[#6C5DD3] underline-offset-2 hover:text-[#6C5DD3]"
                >
                  <FileText className="mr-2 size-4" />
                  View
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4">
            <div>
              <label className={labelClassName}>Primary Supervisor</label>
              <Input
                {...register("onRecords.primarySupervisor")}
                className={
                  errors.onRecords?.primarySupervisor
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Primary Supervisor"
              />
            </div>
            <div>
              <label className={labelClassName}>Secondary Supervisor</label>
              <Input
                {...register("onRecords.secondarySupervisor")}
                className={
                  errors.onRecords?.secondarySupervisor
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Secondary Supervisor"
              />
            </div>
            <div>
              <label className={labelClassName}>Email ID / Login Id</label>
              <Input
                {...register("onRecords.emailLoginId")}
                className={
                  errors.onRecords?.emailLoginId
                    ? `${inputClassName} border-[#ef4444]`
                    : inputClassName
                }
                placeholder="Email / Login Id"
              />
            </div>
            <div>
              <label className={labelClassName}>Location</label>
              <Input
                {...register("onRecords.location")}
                className={
                  errors.onRecords?.location ? `${inputClassName} border-[#ef4444]` : inputClassName
                }
                placeholder="Location"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-13 min-w-[78px] cursor-pointer rounded-[8px] bg-[#6b5bd6] px-5 text-[15px] text-white hover:bg-[#6b5bd6] disabled:opacity-60"
          >
            Submit
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            className="h-13 min-w-[78px] cursor-pointer rounded-[8px] bg-[#d2d4d9] px-5 text-[15px] text-[#111827] hover:bg-[#d2d4d9]"
          >
            Cancel
          </Button>
        </div>
      </form>

      <Dialog open={jobDutyViewOpen} onOpenChange={setJobDutyViewOpen}>
        <DialogContent className="w-[700px] max-w-[95vw] rounded-lg border border-[#e6e7ef] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold text-[#111827]">
              Job Duty Statement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-[13px] text-[#4b5563]">
              File:{" "}
              <span className="font-medium text-[#111827]">
                {jobDutyStatement || "—"}
              </span>
            </p>
            <div className="rounded-[8px] border border-[#e6e7ef] bg-[#F4F5FB] p-4">
              <p className="text-[12px] text-[#4b5563]">
                This is a placeholder preview for the “Job Duty Statement” file.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function ProfileDetail() {
  const profileQuery = useGetProfileDetail()
  const profileId = profileQuery.data?.id ?? "me"

  const updateProfile = useUpdateProfileDetail()

  const initialValues = useMemo<ProfileDetailFormValues>(() => {
    if (!profileQuery.data) return profileDetailDefaultValues
    const { id, ...values } = profileQuery.data
    void id // id is already used for the React key above
    return values
  }, [profileQuery.data])

  if (profileQuery.isLoading) return <ProfileDetailSkeleton />

  return (
    <ProfileDetailForm
      key={profileId}
      initialValues={initialValues}
      onCancel={() => toast.message("Changes discarded.", { position: "top-center" })}
      isSaving={updateProfile.isPending}
      onSubmit={async (values) => {
        try {
          await updateProfile.mutateAsync({ id: profileId, values })
          toast.success("Profile saved successfully", {
            position: "top-center",
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update profile."
          toast.error(message, { position: "top-center" })
        }
      }}
    />
  )
}

