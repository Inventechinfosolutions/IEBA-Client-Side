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
  ADD_EMPLOYEE_BACKUP_SUPERVISOR_REQUIRED,
  ADD_EMPLOYEE_PRIMARY_SUPERVISOR_REQUIRED,
  ADD_EMPLOYEE_SECURITY_ASSIGNMENT_REQUIRED,
  ADD_EMPLOYEE_SECURITY_TRANSFER_REQUIRED,
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
  const [addSecurityTransferSucceeded, setAddSecurityTransferSucceeded] = useState(false)

  const onAddModeSecurityTransferSucceeded = useCallback(() => {
    setAddSecurityTransferSucceeded(true)
  }, [])

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
    setError,
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
        "jobClassificationIds",
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

      // Add-mode tab-specific required checks (not represented in the base schema).
      if (!isEditMode && tabWhenSaving === "security") {
        const count = values.securityAssignedSnapshots?.length ?? 0
        if (count === 0) {
          setError("securityAssignedSnapshots", {
            type: "manual",
            message: ADD_EMPLOYEE_SECURITY_ASSIGNMENT_REQUIRED,
          })
          showInvalidToast(methods.formState.errors)
          return
        }
      }

      if (!isEditMode && tabWhenSaving === "supervisor") {
        const primaryId = (values.supervisorPrimaryId ?? "").trim()
        const secondaryId = (values.supervisorSecondaryId ?? "").trim()

        if (!primaryId) {
          setError("supervisorPrimaryId", { type: "manual", message: ADD_EMPLOYEE_PRIMARY_SUPERVISOR_REQUIRED })
        }
        if (!secondaryId) {
          setError("supervisorSecondaryId", { type: "manual", message: ADD_EMPLOYEE_BACKUP_SUPERVISOR_REQUIRED })
        }
        if (!primaryId || !secondaryId) {
          showInvalidToast(methods.formState.errors)
          return
        }
      }

      // Security / Time Study: Save does not call the API (add + edit); transfers persist via their own mutations.
      if (tabWhenSaving === "security" || tabWhenSaving === "timeStudy") {
        return
      }

      try {
        const sync = await Promise.resolve(onSave({ values, sourceTab: tabWhenSaving }))
        if (!isEditMode && (tabWhenSaving === "employee" || tabWhenSaving === "supervisor")) {
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
    if (!isEditMode && activeTab === "employee" && !tabSaved.employee) {
      showMustSaveBeforeNextToast("employee")
      return
    }
    if (!isEditMode && activeTab === "supervisor" && !tabSaved.supervisor) {
      showMustSaveBeforeNextToast("supervisor")
      return
    }
    if (!isEditMode && activeTab === "security" && !addSecurityTransferSucceeded) {
      toast.warning(ADD_EMPLOYEE_SECURITY_TRANSFER_REQUIRED, {
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

  const furthestUnlockedIndex = (() => {
    if (isEditMode) return orderedAddEmployeeTabs.length - 1

    let unlocked = activeTabIndex

    // Employee -> Security
    if (tabSaved.employee) unlocked = Math.max(unlocked, orderedAddEmployeeTabs.indexOf("security"))

    // Security -> Supervisor (successful transfer + at least one assignment in UI)
    if (addSecurityTransferSucceeded) {
      const snapshots = getValues("securityAssignedSnapshots") ?? []
      if (snapshots.length > 0) {
        unlocked = Math.max(unlocked, orderedAddEmployeeTabs.indexOf("supervisor"))
      }
    }

    // Supervisor -> Time Study
    if (tabSaved.supervisor) unlocked = Math.max(unlocked, orderedAddEmployeeTabs.indexOf("timeStudy"))

    return unlocked
  })()

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
    if (targetIndex <= furthestUnlockedIndex) {
      setActiveTab(tab)
    }
  }

  const disabledTabs = isEditMode
    ? []
    : orderedAddEmployeeTabs.filter((_, index) => index > furthestUnlockedIndex)

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
    onAddModeSecurityTransferSucceeded,
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
