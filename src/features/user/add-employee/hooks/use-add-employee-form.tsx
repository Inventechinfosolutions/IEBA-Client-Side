import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useState } from "react"
import { useForm, type FieldErrors, type FieldValues } from "react-hook-form"
import { AlertTriangle, Check, X } from "lucide-react"
import { toast } from "sonner"

import type {
  AddEmployeeFormTab,
  SaveGatedTab,
  UseAddEmployeeFormParams,
  UserModuleFormValues,
} from "../types"
import {
  ADD_EMPLOYEE_MUST_SAVE_BEFORE_NEXT,
  ADD_EMPLOYEE_SAVE_TO_MOVE_NEXT_MESSAGE,
  ADD_EMPLOYEE_SUPERVISOR_NEEDS_SECURITY_ASSIGNMENTS,
  userModuleFormEditSchema,
  userModuleFormSchema,
} from "../schemas"
import { addEmployeeTabFieldKeys, orderedAddEmployeeTabs } from "../constants/user-form-tabs"

const initialTabSaved: Record<SaveGatedTab, boolean> = {
  employee: false,
  security: false,
  supervisor: false,
}

/** Single-line copy; width follows text up to viewport edge. */
const warningToastClassName =
  "!w-max !max-w-[calc(100vw-2rem)] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]"
const warningToastInnerClassNames = {
  content: "!flex !flex-nowrap !items-center !gap-3",
  title: "!whitespace-nowrap",
} as const

function getErrorMessage(value: unknown): string | null {
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

/**
 * React Hook Form instance, tab state, and handlers for the add/edit employee multi-step form.
 */
export function useAddEmployeeForm({ mode, initialValues, onSave }: UseAddEmployeeFormParams) {
  const isEditMode = mode === "edit"
  const [activeTab, setActiveTab] = useState<AddEmployeeFormTab>("employee")
  const [tabSaved, setTabSaved] = useState<Record<SaveGatedTab, boolean>>(initialTabSaved)

  const methods = useForm<UserModuleFormValues>({
    resolver: zodResolver(isEditMode ? userModuleFormEditSchema : userModuleFormSchema),
    defaultValues: initialValues,
    shouldUnregister: false,
    /** After a field is touched once, validation re-runs on change so password length errors clear when corrected. */
    mode: "onTouched",
    reValidateMode: "onChange",
  })

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState,
    formState: { touchedFields },
    trigger,
  } = methods

  const activeTabIndex = orderedAddEmployeeTabs.indexOf(activeTab)
  const isLastTab = activeTabIndex === orderedAddEmployeeTabs.length - 1

  const getValidationOrder = (): (keyof UserModuleFormValues)[] => {
    if (isEditMode) {
      return [
        "employeeNo",
        "firstName",
        "lastName",
        "phone",
        "loginId",
        "jobClassification",
        "claimingUnit",
      ]
    }
    const unlockedTabs = orderedAddEmployeeTabs.slice(0, activeTabIndex + 1)
    return unlockedTabs.flatMap((tab) => addEmployeeTabFieldKeys[tab])
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

  const showMustSaveBeforeNextToast = (tab: SaveGatedTab) => {
    toast.warning(ADD_EMPLOYEE_MUST_SAVE_BEFORE_NEXT[tab], {
      position: "top-center",
      icon: (
        <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eab308] text-white">
          <AlertTriangle className="size-3 stroke-[2.5]" />
        </span>
      ),
      className: warningToastClassName,
      classNames: warningToastInnerClassNames,
    })
  }

  const handleSave = handleSubmit(
    async (data) => {
      const tabWhenSaving = activeTab
      const snapshot = getValues()
      const values: UserModuleFormValues = {
        ...data,
        locationId: data.locationId ?? snapshot.locationId,
        location: data.location ?? snapshot.location ?? "",
      }
      try {
        const sync = await Promise.resolve(onSave({ values, sourceTab: tabWhenSaving }))
        if (
          !isEditMode &&
          (tabWhenSaving === "employee" ||
            tabWhenSaving === "security" ||
            tabWhenSaving === "supervisor")
        ) {
          setTabSaved((prev) => ({ ...prev, [tabWhenSaving]: true }))
        }
        if (sync?.formValues != null) {
          reset(sync.formValues)
        }
      } catch {
        // Errors are surfaced via toast in the page / mutation
      }
    },
    showInvalidToast,
  )

  const handleNext = async () => {
    const fields = isEditMode
      ? addEmployeeTabFieldKeys[activeTab].filter(
          (field) => field !== "password" && field !== "confirmPassword",
        )
      : addEmployeeTabFieldKeys[activeTab]
    const isValid = await trigger(fields)
    if (!isValid) {
      if (activeTab === "employee" && !isEditMode) {
        const errs = methods.formState.errors
        const fieldMsg = fields.map((f) => getErrorMessage(errs[f])).find(Boolean)
        toast.error(fieldMsg ?? ADD_EMPLOYEE_SAVE_TO_MOVE_NEXT_MESSAGE, {
          position: "top-center",
          icon: (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
              <X className="size-3 stroke-[2.5]" />
            </span>
          ),
          className:
            "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        })
        return
      }
      showInvalidToast(formState.errors)
      return
    }
    if (
      !isEditMode &&
      (activeTab === "employee" || activeTab === "security" || activeTab === "supervisor") &&
      !tabSaved[activeTab]
    ) {
      showMustSaveBeforeNextToast(activeTab)
      return
    }
    if (!isLastTab) {
      const nextTab = orderedAddEmployeeTabs[activeTabIndex + 1]
      if (nextTab === "supervisor") {
        const snapshots = getValues("securityAssignedSnapshots") ?? []
        if (snapshots.length === 0) {
          toast.warning(ADD_EMPLOYEE_SUPERVISOR_NEEDS_SECURITY_ASSIGNMENTS, {
            position: "top-center",
            icon: (
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eab308] text-white">
                <AlertTriangle className="size-3 stroke-[2.5]" />
              </span>
            ),
            className: warningToastClassName,
            classNames: warningToastInnerClassNames,
          })
          return
        }
      }
      setActiveTab(nextTab)
    }
  }

  const handleTabChange = (tab: AddEmployeeFormTab) => {
    if (isEditMode) {
      if (tab === "supervisor") {
        const snapshots = getValues("securityAssignedSnapshots") ?? []
        if (snapshots.length === 0) {
          toast.warning(ADD_EMPLOYEE_SUPERVISOR_NEEDS_SECURITY_ASSIGNMENTS, {
            position: "top-center",
            icon: (
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eab308] text-white">
                <AlertTriangle className="size-3 stroke-[2.5]" />
              </span>
            ),
            className: warningToastClassName,
            classNames: warningToastInnerClassNames,
          })
          return
        }
      }
      setActiveTab(tab)
      return
    }

    const targetIndex = orderedAddEmployeeTabs.indexOf(tab)
    if (targetIndex <= activeTabIndex) {
      setActiveTab(tab)
    }
  }

  const disabledTabs = isEditMode
    ? []
    : orderedAddEmployeeTabs.filter((_, index) => index > activeTabIndex)

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
      },
    )
  }

  return {
    isEditMode,
    methods,
    activeTab,
    disabledTabs,
    isLastTab,
    tabSaved,
    register,
    handleSave,
    handleNext,
    handleTabChange,
    handlePasswordReset,
  }
}

/**
 * Local UI state for the Employee / Login Details tab (file label, password visibility).
 */
export function useEmployeeLoginDetailsUi() {
  const [selectedJobDutyFile, setSelectedJobDutyFile] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setIsConfirmPasswordVisible((prev) => !prev)
  }, [])

  const onJobDutyFileChange = useCallback((fileName: string) => {
    setSelectedJobDutyFile(fileName)
  }, [])

  return {
    selectedJobDutyFile,
    isPasswordVisible,
    isConfirmPasswordVisible,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onJobDutyFileChange,
  }
}
