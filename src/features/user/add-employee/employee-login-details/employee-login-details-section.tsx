import { Controller, useFormContext } from "react-hook-form"
import { Eye, EyeOff } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  MultiSelectDropdown,
  parseMultiSelectStoredValues,
} from "@/components/ui/multi-select-dropdown"

import type { UserModuleFormValues, EmployeeLoginDetailsSectionProps } from "../types"

import {
  useGetAddEmployeeJobClassifications,
  useGetMulticodeMasterCodes,
} from "../queries/get-add-employee"
import { useEmployeeLoginDetailsUi } from "../hooks/use-add-employee-form"

export function EmployeeLoginDetailsSection({ isEditMode }: EmployeeLoginDetailsSectionProps) {
  const jobClassificationsQuery = useGetAddEmployeeJobClassifications()

  const {
    selectedJobDutyFile,
    isPasswordVisible,
    isConfirmPasswordVisible,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onJobDutyFileChange,
  } = useEmployeeLoginDetailsUi()

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors, touchedFields },
  } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const allowMultiCodesEnabled = watch("allowMultiCodes") === true
  const multicodeMasterCodesQuery = useGetMulticodeMasterCodes(allowMultiCodesEnabled)

  const labelClassName = "mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]"
  const passwordErrorClassName = "mt-1 text-[11px] text-[#ff0000]"
  const inputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[12px] text-[#1f2937] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#6C5DD3] focus-visible:ring-0"
  const blockedInputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-[#f3f4f8] px-3 pr-9 text-[12px] text-[#6b7280] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#9aa1b2] focus-visible:border-[#e4e7ef] focus-visible:ring-0"
  const employeeNoInputClassName = `${inputClassName} cursor-not-allowed bg-[#f3f4f8] text-[#6b7280]`
  const passwordErrorMessage = errors.password?.message ? String(errors.password.message) : null
  const showPasswordInlineError =
    !isEditMode && Boolean(passwordErrorMessage) && Boolean(touchedFields.password)

  const loginIdField = register("loginId")

  return (
    <>
      <div className="mb-2 flex items-start justify-between">
        <p className="text-[12px] font-semibold uppercase text-[#111827]">
          {isEditMode ? employeeName : ""}
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#4b5563]">
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
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
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                />
              )}
            />
            PKI USER
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClassName}>*Employee #</label>
          <Input
            {...register("employeeNo")}
            className={isEditMode ? employeeNoInputClassName : inputClassName}
            placeholder="Enter Employee #"
            readOnly={isEditMode}
          />
        </div>
        <div>
          <label className={labelClassName}>Position #</label>
          <Input {...register("positionNo")} className={inputClassName} placeholder="Enter Position #" />
        </div>
        <div>
          <label className={labelClassName}>Location</label>
          <Input {...register("location")} className={inputClassName} />
        </div>

        <div>
          <label className={labelClassName}>*First Name</label>
          <Input {...register("firstName")} className={inputClassName} placeholder="First Name" />
        </div>
        <div>
          <label className={labelClassName}>*Last Name</label>
          <Input {...register("lastName")} className={inputClassName} placeholder="Last Name" />
        </div>
        <div>
          <label className={labelClassName}>Phone</label>
          <Input {...register("phone")} className={inputClassName} placeholder="___-___-____" />
        </div>

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

        {!isEditMode ? (
          <>
            <div>
              <label className={labelClassName}>*Password</label>
              <div className="flex items-stretch">
                <Input
                  type={isPasswordVisible ? "text" : "password"}
                  {...register("password")}
                  className={`${inputClassName} rounded-r-none border-r-0`}
                  placeholder="Password (min 11 chars, 1 capital letter, 1 symbol)"
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
                <p className={passwordErrorClassName}>{passwordErrorMessage}</p>
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
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelClassName}>Email Address</label>
              <Input
                {...register("emailAddress")}
                className={`${blockedInputClassName} cursor-not-allowed`}
                placeholder="Email"
                readOnly
                tabIndex={-1}
              />
            </div>
            <div aria-hidden className="min-h-0" />
          </>
        )}

        {!isEditMode ? (
          <div>
            <label className={labelClassName}>Email Address</label>
            <Input
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
          {jobClassificationsQuery.isError ? (
            <Input
              {...register("jobClassification")}
              className={inputClassName}
              placeholder="Job classification (manual entry)"
            />
          ) : (
            <Controller
              name="jobClassification"
              control={control}
              render={({ field }) => {
                const rows = jobClassificationsQuery.data ?? []
                const tokens = parseMultiSelectStoredValues(field.value ?? "")
                const rowNames = new Set(rows.map((r) => r.name))
                const orphanTokens = [...new Set(tokens.filter((t) => !rowNames.has(t)))]
                const options = [
                  ...rows.map((j) => ({ value: j.name, label: j.name })),
                  ...orphanTokens.map((t) => ({ value: t, label: t })),
                ]
                return (
                  <MultiSelectDropdown
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Select job classification"
                    options={options}
                    isLoading={jobClassificationsQuery.isPending}
                  />
                )
              }}
            />
          )}
        </div>
        <div>
          <label className={labelClassName}>Job Duty Statement</label>
          <label className="flex h-[43px] cursor-pointer select-none items-center rounded-[7px] border border-[#e4e7ef] bg-white px-2 text-[11px] text-[#8f96a8]">
            <span className="rounded-[3px] border border-[#cfd4df] bg-[#f7f8fb] px-2 py-[1px] text-[11px] text-[#2a2f3a]">
              Choose File..
            </span>
            <span className="ml-2 truncate">{selectedJobDutyFile || "No file chosen"}</span>
            <input
              type="file"
              className="hidden"
              onChange={(event) =>
                onJobDutyFileChange(event.target.files?.[0]?.name ?? "")
              }
            />
          </label>
        </div>

        <div>
          <label className={labelClassName}>*Claiming Unit</label>
          <Input
            {...register("claimingUnit")}
            className={inputClassName}
            placeholder="Enter claiming unit"
          />
        </div>
        <div className="col-span-2 flex items-center gap-6 pt-6">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[#111827]">
            <Controller
              name="spmp"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
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
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                />
              )}
            />
            Multilingual
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex shrink-0 cursor-pointer select-none items-center gap-2 text-[12px] text-[#111827]">
              <Controller
                name="allowMultiCodes"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      const on = checked === true
                      field.onChange(on)
                      if (!on) {
                        setValue("assignedMultiCodes", "", {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    }}
                    className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                  />
                )}
              />
              Allow MultiCodes
            </label>
            {allowMultiCodesEnabled ? (
              <div className="min-w-[200px] max-w-[280px] shrink-0">
                <Controller
                  name="assignedMultiCodes"
                  control={control}
                  render={({ field }) => {
                    const rows = multicodeMasterCodesQuery.data ?? []
                    const tokens = parseMultiSelectStoredValues(field.value ?? "")
                    const rowNames = new Set(rows.map((r) => r.name))
                    const orphanTokens = [...new Set(tokens.filter((t) => !rowNames.has(t)))]
                    const options = [
                      ...rows.map((r) => ({ value: r.name, label: r.name })),
                      ...orphanTokens.map((t) => ({ value: t, label: t })),
                    ]
                    return (
                      <MultiSelectDropdown
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Select MultiCodes"
                        options={options}
                        isLoading={multicodeMasterCodesQuery.isPending}
                      />
                    )
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

/** @deprecated Use EmployeeLoginDetailsSection */
export const EmployeeDetailsContent = EmployeeLoginDetailsSection
