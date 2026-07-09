import { useLayoutEffect, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { Checkbox } from "@/components/ui/checkbox"
import { TitleCaseInput } from "@/components/ui/title-case-input"
import { Input } from "@/components/ui/input"
import {
  MultiSelectDropdown,
} from "@/components/ui/multi-select-dropdown"
import { SingleSelectDropdown, type SingleSelectOption } from "@/components/ui/dropdown"

import type { UserModuleFormValues, EmployeeLoginDetailsSectionProps } from "../types"
import {
  useGetAddEmployeeJobClassifications,
  useGetAddEmployeeLocations,
  useGetUserDetailsTab,
} from "../queries/get-add-employee"
import { useEmployeeLoginDetailsUi } from "../hooks/use-add-employee-form"
import { addEmployeeLookupKeys } from "../keys"
import { formatPhoneUs10Input } from "../schemas"
import { syncTab1EmployeeLoginFields } from "../utility/refetchFormAfterTabSave"


import { usePermissions } from "@/hooks/usePermissions"
import { capitalize } from "@/lib/utils"

export function EmployeeLoginDetailsSection({
  isEditMode,
  userId,
}: EmployeeLoginDetailsSectionProps) {
  /** Defer GET /jobclassification and /location until the user opens the picker. */
  const [jobClassificationMenuOpened, setJobClassificationMenuOpened] = useState(false)
  const [locationMenuOpened, setLocationMenuOpened] = useState(false)

  const { isSuperAdmin, user } = usePermissions()
  const queryClient = useQueryClient()
  // Show dept assignment for all non-super-admin roles (PayrollAdmin, TimeStudyAdmin, DeptAdmin, etc.)
  const showDeptAutoAssign = !isSuperAdmin

  const jobClassificationsEnabled = jobClassificationMenuOpened
  const locationsEnabled = locationMenuOpened

  const jobClassificationsQuery = useGetAddEmployeeJobClassifications(jobClassificationsEnabled)
  const locationsQuery = useGetAddEmployeeLocations(locationsEnabled)
  const tabDetailsQuery = useGetUserDetailsTab(userId, "tab1", isEditMode)
  const tabData = tabDetailsQuery.data as any

  const {
    selectedJobDutyFile,
    isPasswordVisible,
    isConfirmPasswordVisible,
    isUploading,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onJobDutyFileChange,
    onDeleteJobDutyFile,
    onPreviewJobDutyFile,
  } = useEmployeeLoginDetailsUi(userId)

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors, touchedFields, dirtyFields },
  } = useFormContext<UserModuleFormValues>()

  useLayoutEffect(() => {
    if (!isEditMode || !tabData || typeof tabData !== "object") return
    syncTab1EmployeeLoginFields(setValue, getValues, tabData as Record<string, unknown>)
  }, [isEditMode, tabData, setValue, getValues])

  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  const labelClassName = "mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]"
  const passwordErrorClassName = "mt-1 text-[11px] text-[#ff0000]"
  const inputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[12px] text-[#1f2937] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
  const blockedInputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-[#f3f4f8] px-3 pr-9 text-[12px] text-[#6b7280] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#9aa1b2] focus-visible:border-[#e4e7ef] focus-visible:ring-0"
  const employeeNoInputClassName = `${inputClassName} cursor-not-allowed bg-[#f3f4f8] text-[#6b7280]`
  const passwordErrorMessage = errors.password?.message ? String(errors.password.message) : null
  const confirmPasswordErrorMessage = errors.confirmPassword?.message
    ? String(errors.confirmPassword.message)
    : null
  const passwordFieldTouchedOrDirty = Boolean(touchedFields.password || dirtyFields.password)
  const confirmPasswordFieldTouchedOrDirty = Boolean(
    touchedFields.confirmPassword || dirtyFields.confirmPassword,
  )
  const showPasswordInlineError =
    !isEditMode && Boolean(passwordErrorMessage) && passwordFieldTouchedOrDirty
  const showConfirmPasswordInlineError =
    !isEditMode && Boolean(confirmPasswordErrorMessage) && confirmPasswordFieldTouchedOrDirty

  const loginIdField = register("loginId")

  return (
    <>
      <div className="mb-2 flex items-start justify-between">
        <p className="text-[12px] font-semibold uppercase text-[#111827]">
          {isEditMode ? employeeName : ""}
        </p>
        <div className="space-y-2 flex items-start justify-between gap-4">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#4b5563]">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                />
              )}
            />
            Active
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#4b5563]">
            <Controller
              name="pkiUser"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                />
              )}
            />
            PKI USER
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div>
          <label className={labelClassName}>*Employee #</label>
          <TitleCaseInput
            {...register("employeeNo")}
            value={watch("employeeNo") || tabData?.employeeId || tabData?.employeeNo || ""}
            className={isEditMode ? employeeNoInputClassName : inputClassName}
            placeholder="Enter Employee #"
            readOnly={isEditMode}
          />
        </div>
        <div>
          <label className={labelClassName}>Position #</label>
          <TitleCaseInput {...register("positionNo")} className={inputClassName} placeholder="Enter Position #" />
        </div>
        <div>
          <label className={labelClassName}>Location</label>
          <Controller
            name="locationId"
            control={control}
            render={({ field }) => {
              const rows = locationsQuery.data ?? []
              const rowById = new Map(rows.map((r) => [r.id, r]))
              const selectedId = field.value ?? tabData?.location?.id
              const locationLabel =
                (watch("location") ?? "").trim() || tabData?.location?.name?.trim() || ""
              const hasOrphanSelection =
                selectedId != null &&
                !rowById.has(selectedId) &&
                locationLabel.length > 0

              const options: SingleSelectOption[] = []
              if (hasOrphanSelection && selectedId != null) {
                options.push({
                  value: String(selectedId),
                  label: locationLabel,
                  key: `location-orphan-${selectedId}`,
                })
              }
              for (const r of rows) {
                options.push({
                  value: String(r.id),
                  label: r.name,
                  key: `location-${r.id}`,
                })
              }

              const dropdownValue =
                selectedId != null && (rowById.has(selectedId) || hasOrphanSelection)
                  ? String(selectedId)
                  : ""

              return (
                <SingleSelectDropdown
                  value={dropdownValue}
                  onChange={(v) => {
                    const id = Number.parseInt(v, 10)
                    if (!Number.isFinite(id)) return
                    field.onChange(id)
                    const row = rowById.get(id)
                    setValue("location", row?.name ?? locationLabel, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }}
                  onBlur={field.onBlur}
                  onOpenChange={(open) => {
                    if (open) {
                      setLocationMenuOpened(true)
                      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.locations() })
                    }
                  }}
                  options={options}
                  placeholder="Select location"
                  isLoading={locationsEnabled && locationsQuery.isFetching}
                  loadingLabel="Loading locations…"
                  className={inputClassName}
                  contentClassName="max-h-[280px]"
                />
              )
            }}
          />
          {locationsQuery.isError ? (
            <p className="mt-1 text-[11px] text-red-500" role="alert">
              {locationsQuery.error instanceof Error
                ? locationsQuery.error.message
                : "Failed to load locations"}
            </p>
          ) : null}
        </div>

        <div>
          <label className={labelClassName}>*First Name</label>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TitleCaseInput
                {...field}
                value={field.value || tabData?.firstName || ""}
                className={inputClassName}
                placeholder="First Name"
                onChange={(e) => field.onChange(capitalize(e.target.value))}
              />
            )}
          />
        </div>
        <div>
          <label className={labelClassName}>*Last Name</label>
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TitleCaseInput
                {...field}
                value={field.value || tabData?.lastName || ""}
                className={inputClassName}
                placeholder="Last Name"
                onChange={(e) => field.onChange(capitalize(e.target.value))}
              />
            )}
          />
        </div>
        <div>
          <label className={labelClassName}>Phone</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TitleCaseInput
                {...field}
                className={inputClassName}
                placeholder="___-___-____"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={12}
                onChange={(e) => field.onChange(formatPhoneUs10Input(e.target.value))}
              />
            )}
          />
          {errors.phone?.message ? (
            <p className={passwordErrorClassName} role="alert">
              {String(errors.phone.message)}
            </p>
          ) : null}
        </div>

        {!isEditMode ? (
          <div>
            <label className={labelClassName}>*Login Id</label>
            <Input
              {...loginIdField}
              className={inputClassName}
              placeholder="Email"
              onChange={(e) => {
                void loginIdField.onChange(e)
                setValue("emailAddress", e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }}
            />
          </div>
        ) : (
          <div className="col-span-1">
            <label className={labelClassName}>Login Id / Email Address</label>
            <Input
              {...loginIdField}
              className={`${blockedInputClassName} cursor-not-allowed`}
              readOnly
              tabIndex={-1}
            />
          </div>
        )}

        {!isEditMode ? (
          <>
            <div>
              <label className={labelClassName}>*Password</label>
              <div className="flex items-stretch">
                <Input
                  type={isPasswordVisible ? "text" : "password"}
                  {...register("password")}
                  className={`${inputClassName} rounded-r-none border-r-0`}
                  placeholder="10–16 chars, 1 capital, 1 symbol"
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="inline-flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-r-[7px] border border-[#e4e7ef] bg-white text-[#9aa1b2]"
                  onClick={togglePasswordVisibility}
                >
                  {isPasswordVisible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>
              </div>
              {showPasswordInlineError ? (
                <p className={passwordErrorClassName} role="alert">
                  {passwordErrorMessage}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClassName}>*Confirm Password</label>
              <div className="flex items-stretch">
                <Input
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  {...register("confirmPassword")}
                  className={`${inputClassName} rounded-r-none border-r-0`}
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  aria-label="Toggle confirm password visibility"
                  className="inline-flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-r-[7px] border border-[#e4e7ef] bg-white text-[#9aa1b2]"
                  onClick={toggleConfirmPasswordVisibility}
                >
                  {isConfirmPasswordVisible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>
              </div>
              {showConfirmPasswordInlineError ? (
                <p className={passwordErrorClassName} role="alert">
                  {confirmPasswordErrorMessage}
                </p>
              ) : null}
            </div>
          </>
        ) : null}

        {!isEditMode ? (
          <div>
            <label className={labelClassName}>Email Address</label>
            <TitleCaseInput
              {...register("emailAddress")}
              className={`${blockedInputClassName} cursor-not-allowed`}
              placeholder="Email"
              readOnly
              tabIndex={-1}
            />
          </div>
        ) : null}

        <div>
          <label className={labelClassName}>*Job Classification</label>
          <Controller
            name="jobClassificationIds"
            control={control}
            render={({ field }) => {
              const rows = jobClassificationsQuery.data ?? []
              const tabJobRows = (tabData?.jobClassifications ?? []) as Array<{
                id: number
                name: string
              }>
              const formIds = field.value ?? []
              const selectedId = formIds[0]
              const rowById = new Map(rows.map((r) => [r.id, r]))
              const isOrphan = selectedId != null && !rowById.has(selectedId)
              const tabJobName =
                tabJobRows.find((j) => j.id === selectedId)?.name?.trim() ?? ""

              const options: SingleSelectOption[] = rows.map((j) => ({
                value: String(j.id),
                label: j.name,
                key: `job-class-${j.id}`,
              }))

              if (isOrphan && selectedId != null) {
                options.unshift({
                  value: String(selectedId),
                  label: tabJobName || `Id ${selectedId}`,
                  key: `job-class-orphan-${selectedId}`,
                })
              }

              return (
                <SingleSelectDropdown
                  value={selectedId != null ? String(selectedId) : ""}
                  onChange={(v) => {
                    const id = Number.parseInt(v, 10)
                    field.onChange(Number.isFinite(id) ? [id] : [])
                  }}
                  onBlur={field.onBlur}
                  onOpenChange={(open) => {
                    if (open) {
                      setJobClassificationMenuOpened(true)
                      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.jobClassifications() })
                    }
                  }}
                  options={options}
                  placeholder="Select job classification"
                  isLoading={jobClassificationsEnabled && jobClassificationsQuery.isPending}
                  loadingLabel="Loading classifications…"
                  className={inputClassName}
                  contentClassName="max-h-[280px]"
                />
              )
            }}
          />
          {jobClassificationsQuery.isError ? (
            <p className="mt-1 text-[11px] text-red-500" role="alert">
              {jobClassificationsQuery.error instanceof Error
                ? jobClassificationsQuery.error.message
                : "Failed to load job classifications"}
            </p>
          ) : null}
        </div>
        <div>
          <label className={labelClassName}>Job Duty Statement</label>
          <div className="flex h-[43px] items-center rounded-[7px] border border-[#e4e7ef] bg-white px-2 text-[11px] text-[#8f96a8]">
            {!selectedJobDutyFile ? (
              <label className="flex flex-1 cursor-pointer items-center">
                <span className="rounded-[3px] border border-[#cfd4df] bg-[#f7f8fb] px-2 py-px text-[11px] text-[#2a2f3a]">
                  Choose File..
                </span>
                <span className="ml-2 truncate font-medium text-[#374151]">No file chosen</span>
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(event) => onJobDutyFileChange(event.target.files?.[0] ?? null)}
                />
              </label>
            ) : (
              <div className="flex flex-1 items-center justify-between overflow-hidden">
                <span className="truncate font-medium text-[#374151]">{selectedJobDutyFile}</span>
                <div className="flex items-center gap-2">
                  {isUploading && <Loader2 className="size-3 animate-spin text-[#6C5DD3]" />}
                  <button
                    type="button"
                    onClick={onPreviewJobDutyFile}
                    className="flex size-6 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50"
                    title="Preview"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteJobDutyFile}
                    className="flex size-6 items-center justify-center rounded-md text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={labelClassName}>*Claiming Unit</label>
          <TitleCaseInput
            {...register("claimingUnit")}
            className={inputClassName}
            placeholder="Enter claiming unit"
          />
        </div>
        <div className="col-span-full sm:col-span-2 flex items-center gap-6 pt-4 sm:pt-6">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[#111827]">
            <Controller
              name="spmp"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                />
              )}
            />
            SPMP
          </label>
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[#111827]">
            <Controller
              name="multilingual"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                />
              )}
            />
            Multilingual
          </label>
        </div>
      </div>

      {showDeptAutoAssign && !isEditMode && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelClassName}>*Department Assignment</label>
            <Controller
              name="autoAssignedDepartments"
              control={control}
              render={({ field }) => {
                let options: { label: string; value: string }[] = []
                
                const depMap = new Map<number, string>()
                user?.departmentRoles?.forEach((dr) => {
                  if (dr.departmentId) depMap.set(dr.departmentId, dr.departmentName)
                })
                options = Array.from(depMap.entries()).map(([id, name]) => ({
                  label: name,
                  value: String(id),
                }))
                
                return (
                  <MultiSelectDropdown
                    value={field.value ?? ""}
                    onChange={(val) => {
                      field.onChange(val)
                      if (val && val.trim()) {
                        clearErrors("autoAssignedDepartments")
                      }
                    }}
                    onBlur={field.onBlur}
                    placeholder="Select departments"
                    options={options}
                  />
                )
              }}
            />
            {errors.autoAssignedDepartments?.message ? (
              <p className="mt-1 text-[11px] text-[#ff0000]" role="alert">
                {String(errors.autoAssignedDepartments.message)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}

/** @deprecated Use EmployeeLoginDetailsSection */
export const EmployeeDetailsContent = EmployeeLoginDetailsSection
