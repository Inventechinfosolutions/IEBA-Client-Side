import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type FieldErrors,
  type FieldValues,
} from "react-hook-form"
import { Check, Eye, EyeOff, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { userModuleFormSchema } from "@/features/user/schemas"
import {
  type EmployeeDetailsContentProps,
  type UserFormPanelProps,
  type UserFormTab,
  type UserModuleFormValues,
} from "@/features/user/types"

import { SecurityAssignmentsPanel } from "./SecurityAssignmentsPanel"
import { SupervisorAssignmentsPanel } from "./SupervisorAssignmentsPanel"
import { TimeStudyAssignmentsPanel } from "./TimeStudyAssignmentsPanel"
import { UserFormTabs } from "./UserFormTabs"

const orderedTabs: UserFormTab[] = ["employee", "security", "supervisor", "timeStudy"]

const tabFields: Record<UserFormTab, (keyof UserModuleFormValues)[]> = {
  employee: [
    "employeeNo",
    "firstName",
    "lastName",
    "loginId",
    "password",
    "confirmPassword",
    "jobClassification",
    "claimingUnit",
  ],
  security: ["roleAssignments"],
  supervisor: ["supervisorPrimary", "supervisorSecondary"],
  timeStudy: ["tsMinDay", "programs", "activities", "supervisorApportioning"],
}

function EmployeeDetailsContent({ isEditMode }: EmployeeDetailsContentProps) {
  const [selectedJobDutyFile, setSelectedJobDutyFile] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const {
    register,
    control,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()

  const labelClassName = "mb-1 block select-none text-[11px] font-medium text-[#2a2f3a]"
  const passwordErrorClassName = "mt-1 text-[11px] text-[#ff0000]"
  const inputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-white px-3 text-[12px] text-[#1f2937] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#c2c7d3] focus-visible:border-[#cfc6ff] focus-visible:ring-0"
  const blockedInputClassName =
    "h-[43px] rounded-[7px] border border-[#e4e7ef] bg-[#f3f4f8] px-3 pr-9 text-[12px] text-[#6b7280] shadow-none placeholder:text-[11px] placeholder:font-normal placeholder:text-[#9aa1b2] focus-visible:border-[#e4e7ef] focus-visible:ring-0"
  const employeeNoInputClassName = `${inputClassName} cursor-not-allowed bg-[#f3f4f8] text-[#6b7280]`
  const passwordErrorMessage = errors.password?.message ? String(errors.password.message) : null
  const showPasswordInlineError =
    !isEditMode && Boolean(passwordErrorMessage) && Boolean(touchedFields.password)

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
          <label className={labelClassName}>
            {isEditMode ? "*Login Id / Email Address" : "*Login Id"}
          </label>
          <Input
            {...register("loginId")}
            className={inputClassName}
            placeholder={isEditMode ? "Enter Login ID or Email" : "Login Id"}
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
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
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
                  onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
                >
                  {isConfirmPasswordVisible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
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
          </>
        ) : null}

        <div>
          <label className={labelClassName}>*Job Classification</label>
          <Input {...register("jobClassification")} className={inputClassName} placeholder="Select Job Classification" />
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
              onChange={(event) => setSelectedJobDutyFile(event.target.files?.[0]?.name ?? "")}
            />
          </label>
        </div>

        <div>
          <label className={labelClassName}>*Claiming Unit</label>
          <Input {...register("claimingUnit")} className={inputClassName} placeholder="Claiming Unit" />
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
          <label className="flex cursor-pointer select-none items-center gap-2 text-[12px] text-[#111827]">
            <Controller
              name="allowMultiCodes"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                />
              )}
            />
            Allow MultiCodes
          </label>
        </div>
      </div>
    </>
  )
}

export function EmployeePanel({ mode, initialValues, onCancel, onSave }: UserFormPanelProps) {
  const isEditMode = mode === "edit"
  const [activeTab, setActiveTab] = useState<UserFormTab>("employee")
  const methods = useForm<UserModuleFormValues>({
    resolver: zodResolver(userModuleFormSchema),
    defaultValues: initialValues,
  })
  const {
    register,
    handleSubmit,
    formState,
    formState: { touchedFields },
    trigger,
  } = methods

  const activeTabIndex = orderedTabs.indexOf(activeTab)
  const isLastTab = activeTabIndex === orderedTabs.length - 1

  const getValidationOrder = (): (keyof UserModuleFormValues)[] => {
    if (isEditMode) {
      return ["employeeNo", "firstName", "lastName", "loginId", "jobClassification", "claimingUnit"]
    }
    const unlockedTabs = orderedTabs.slice(0, activeTabIndex + 1)
    return unlockedTabs.flatMap((tab) => tabFields[tab])
  }

  const getErrorMessage = (value: unknown): string | null => {
    if (!value || typeof value !== "object") return null
    if ("message" in value && typeof value.message === "string" && value.message) {
      return value.message
    }
    const nestedValues = Object.values(value as FieldErrors<FieldValues>)
    for (const nestedValue of nestedValues) {
      const nested = getErrorMessage(nestedValue)
      if (nested) return nested
    }
    return null
  }

  const showInvalidToast = (formErrors: FieldErrors<UserModuleFormValues>) => {
    const fieldOrder = getValidationOrder()
    const firstInvalidField = fieldOrder.find((field) => Boolean(formErrors[field]))
    if (!firstInvalidField) return
    if (!isEditMode && firstInvalidField === "password" && touchedFields.password) return

    const firstMessage = getErrorMessage(formErrors[firstInvalidField])
    if (!firstMessage) return
    toast.error(firstMessage, {
      position: "top-center",
      icon: (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
          <X className="size-3 stroke-[2.5]" />
        </span>
      ),
      className:
        "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
    })
  }

  const handleSave = handleSubmit(
    (values) => {
      onSave(values)
    },
    showInvalidToast
  )

  const handleNext = async () => {
    const fields = isEditMode
      ? tabFields[activeTab].filter(
          (field) => field !== "password" && field !== "confirmPassword"
        )
      : tabFields[activeTab]
    const isValid = await trigger(fields)
    if (!isValid) {
      showInvalidToast(formState.errors)
      return
    }
    if (!isLastTab) {
      setActiveTab(orderedTabs[activeTabIndex + 1])
    }
  }

  const handleTabChange = (tab: UserFormTab) => {
    if (isEditMode) {
      setActiveTab(tab)
      return
    }

    const targetIndex = orderedTabs.indexOf(tab)
    if (targetIndex <= activeTabIndex) {
      setActiveTab(tab)
    }
  }

  const disabledTabs = isEditMode
    ? []
    : orderedTabs.filter((_, index) => index > activeTabIndex)

  const handlePasswordReset = () => {
    toast.success(
      <span>
        Password Reset Sucessfully by default the password will be :{" "}
        <span className="text-[#ef4444]">Password1-2</span>
      </span>,
      {
        icon: (
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
            <Check className="size-3 stroke-[3]" />
          </span>
        ),
        className:
          "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
      }
    )
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSave} className="rounded-[8px] border border-[#d8dce8] bg-white">
        {isEditMode ? (
          <>
            <input type="hidden" {...register("password")} />
            <input type="hidden" {...register("confirmPassword")} />
          </>
        ) : null}

        <UserFormTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          disabledTabs={disabledTabs}
        />

        <div className="min-h-[200px] px-8 pb-8 pt-6">
          {activeTab === "employee" ? <EmployeeDetailsContent isEditMode={isEditMode} /> : null}
          {activeTab === "security" ? <SecurityAssignmentsPanel /> : null}
          {activeTab === "supervisor" ? <SupervisorAssignmentsPanel /> : null}
          {activeTab === "timeStudy" ? <TimeStudyAssignmentsPanel /> : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6b5bd6] px-5 text-[12px] text-white hover:bg-[#6b5bd6]"
            >
              Save
            </Button>
              {!isEditMode && !isLastTab ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6b5bd6] px-5 text-[12px] text-white hover:bg-[#6b5bd6]"
              >
                Next
              </Button>
            ) : null}
              {isEditMode && activeTab === "employee" ? (
              <Button
                type="button"
                onClick={handlePasswordReset}
                className="h-9 min-w-[120px] cursor-pointer rounded-[8px] bg-[#6b5bd6] px-5 text-[12px] text-white hover:bg-[#6b5bd6]"
              >
                Password Reset
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onCancel}
              className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#d2d4d9] px-5 text-[12px] text-[#111827] hover:bg-[#d2d4d9]"
            >
              Exit
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
