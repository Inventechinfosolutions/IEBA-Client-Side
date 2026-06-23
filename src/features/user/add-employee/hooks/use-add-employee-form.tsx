import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useState } from "react"
import { api } from "@/lib/api"
import { useForm, useFormContext, type FieldErrors, type FieldValues } from "react-hook-form"
import { AlertTriangle, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useUploadUserDocument } from "../mutations/upload-user-document"
import { apiResetUser } from "../../api"
import { mapFormValuesToUpdateDto } from "../../utility/mapUserDetailsToForm"

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
  ADD_EMPLOYEE_DEPARTMENT_ASSIGNMENT_REQUIRED,
  userModuleFormEditSchema,
  userModuleFormSchema,
} from "../schemas"
import { addEmployeeTabFieldKeys, orderedAddEmployeeTabs } from "../constants/user-form-tabs"
import { resolveSecurityRolesForSupervisorTab } from "../utility/parseSecurityDepartmentRoles"
import { syncSecurityAssignmentsForm } from "../utility/syncSecurityAssignmentsForm"
import { usePermissions } from "@/hooks/usePermissions"

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

function hasFieldChanged(dirty: Record<string, any>, field: string): boolean {
  const value = dirty[field];
  if (!value) return false;
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (item && typeof item === "object") {
        return Object.keys(item).some((key) => {
          const subVal = (item as any)[key];
          if (subVal && typeof subVal === "object") {
            return Object.keys(subVal).some((subKey) => Boolean((subVal as any)[subKey]));
          }
          return Boolean(subVal);
        });
      }
      return Boolean(item);
    });
  }
  if (typeof value === "object") {
    return Object.keys(value).some((key) => {
      const subVal = value[key];
      if (subVal && typeof subVal === "object") {
        return Object.keys(subVal).some((subKey) => Boolean((subVal as any)[subKey]));
      }
      return Boolean(subVal);
    });
  }
  return Boolean(value);
}

/**
 * React Hook Form instance, tab state, and handlers for the add/edit employee multi-step form.
 */
export function useAddEmployeeForm({
  mode,
  initialValues,
  securityContextUserId = null,
  onSave,
}: UseAddEmployeeFormParams) {
  const isEditMode = mode === "edit"
  const { isSuperAdmin } = usePermissions()
  const showDeptAutoAssign = !isSuperAdmin
  const [activeTab, setActiveTab] = useState<AddEmployeeFormTab>("employee")
  const [tabSaved, setTabSaved] = useState<Record<SaveGatedTab, boolean>>(initialTabSaved)
  const [addSecurityTransferSucceeded, setAddSecurityTransferSucceeded] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const onAddModeSecurityTransferSucceeded = useCallback(() => {
    setAddSecurityTransferSucceeded(true)
  }, [])

  const methods = useForm<UserModuleFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEditMode ? userModuleFormEditSchema : userModuleFormSchema) as any,
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
    setValue,
    setError,
    formState,
    formState: { touchedFields },
    trigger,
  } = methods

  const ensureSupervisorTabAllowed = useCallback(async (): Promise<boolean> => {
    const formSnapshots = getValues("securityAssignedSnapshots") ?? []
    const roles = await resolveSecurityRolesForSupervisorTab(
      securityContextUserId,
      formSnapshots,
    )
    if (!roles?.assignedSnapshots.length) return false

    if (formSnapshots.length === 0) {
      syncSecurityAssignmentsForm(setValue, roles)
    }
    return true
  }, [getValues, securityContextUserId, setValue])

  const showSupervisorNeedsSecurityToast = useCallback(() => {
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
  }, [])

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
    const firstInvalidFieldInOrder = fieldOrder.find((field) => Boolean(formErrors[field]))
    const firstInvalidField = firstInvalidFieldInOrder || Object.keys(formErrors)[0] as keyof UserModuleFormValues
    
    if (!firstInvalidField) return
    if (!isEditMode && firstInvalidField === "password" && touchedFields.password) return

    const firstMessage = getErrorMessage(formErrors[firstInvalidField])
    if (!firstMessage) return
    
    const displayMessage = firstMessage === "Invalid input: expected string, received undefined"
      ? `Field "${String(firstInvalidField)}" is missing or invalid`
      : firstMessage;

    toast.error(displayMessage, {
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
      } as unknown as UserModuleFormValues

      // Add-mode tab-specific required checks (not represented in the base schema).
      if (!isEditMode && tabWhenSaving === "employee" && showDeptAutoAssign) {
        const autoAssignedDepts = (values.autoAssignedDepartments ?? "").trim()
        if (!autoAssignedDepts) {
          setError("autoAssignedDepartments", {
            type: "manual",
            message: ADD_EMPLOYEE_DEPARTMENT_ASSIGNMENT_REQUIRED,
          })
          showInvalidToast({
            ...methods.formState.errors,
            autoAssignedDepartments: {
              type: "manual",
              message: ADD_EMPLOYEE_DEPARTMENT_ASSIGNMENT_REQUIRED,
            } as any,
          })
          return
        }
      }

      if (!isEditMode && tabWhenSaving === "security") {
        const count = values.securityAssignedSnapshots?.length ?? 0;
        if (count === 0) {
          // Show a warning but do not block the save operation.
          toast.warning(ADD_EMPLOYEE_SECURITY_ASSIGNMENT_REQUIRED, {
            position: "top-center",
            icon: (
              <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#eab308] text-white">
                <AlertTriangle className="size-3 stroke-[2.5]" />
              </span>
            ),
            className: warningToastClassName,
            classNames: warningToastInnerClassNames,
          });
          // Continue without returning; allow the save to proceed.
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

      // Security / Time Study: Save calls onSave to allow the parent to persist state if needed.
      if (tabWhenSaving === "timeStudy") {
        return
      }

      // Edit mode guard: block save when none of this tab's fields have actually changed.
      // formState.dirtyFields is computed by RHF against defaultValues (= server state after reset).
      if (isEditMode) {
        const dirty = formState.dirtyFields as Record<string, unknown>
        const tabFields = addEmployeeTabFieldKeys[tabWhenSaving] as readonly string[]
        const hasTabChanges = tabFields.some((f) => hasFieldChanged(dirty, f))
        if (!hasTabChanges) {
          toast.warning("No changes to save", {
            position: "top-center",
            className:
              "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
          })
          return
        }
      }

      try {
        const sync = await Promise.resolve(
          onSave({
            values,
            sourceTab: tabWhenSaving,
            defaultValues: isEditMode
              ? (methods.formState.defaultValues as Partial<UserModuleFormValues>)
              : undefined,
          }),
        )
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
    if (!isEditMode && activeTab === "employee" && showDeptAutoAssign) {
      const autoAssignedDepts = (getValues("autoAssignedDepartments") ?? "").trim()
      if (!autoAssignedDepts) {
        setError("autoAssignedDepartments", {
          type: "manual",
          message: ADD_EMPLOYEE_DEPARTMENT_ASSIGNMENT_REQUIRED,
        })
        showInvalidToast({
          ...formState.errors,
          autoAssignedDepartments: {
            type: "manual",
            message: ADD_EMPLOYEE_DEPARTMENT_ASSIGNMENT_REQUIRED,
          } as any,
        })
        return
      }
    }

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
    if (!isEditMode && activeTab === "security") {
      const snapshots = getValues("securityAssignedSnapshots") ?? []
      const hasAssignments = addSecurityTransferSucceeded || snapshots.length > 0
      if (!hasAssignments) {
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
    }
    if (!isLastTab) {
      const nextTab = orderedAddEmployeeTabs[activeTabIndex + 1]
      if (nextTab === "supervisor") {
        const allowed = await ensureSupervisorTabAllowed()
        if (!allowed) {
          showSupervisorNeedsSecurityToast()
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
    const snapshots = getValues("securityAssignedSnapshots") ?? []
    if (addSecurityTransferSucceeded || snapshots.length > 0) {
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
        void (async () => {
          const allowed = await ensureSupervisorTabAllowed()
          if (!allowed) {
            showSupervisorNeedsSecurityToast()
            return
          }
          setActiveTab(tab)
        })()
        return
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

  const handlePasswordReset = async () => {
    if (!securityContextUserId) return
    setIsResettingPassword(true)
    try {
      const currentValues = getValues()
      const dto = mapFormValuesToUpdateDto(currentValues, { includePassword: false })
      await apiResetUser(securityContextUserId, dto)
      toast.success(
        <span>
          Password Reset Successfully by default the password will be:{" "}
          <span className="text-[#ef4444]">Password1-2</span>
        </span>,
        {
          icon: (
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
              <Check className="size-3 stroke-3" />
            </span>
          ),
          className:
            "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
        },
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Password reset failed"
      toast.error(message, {
        position: "top-center",
        icon: (
          <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444] text-white">
            <X className="size-3 stroke-[2.5]" />
          </span>
        ),
        className:
          "!w-fit !max-w-[340px] !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[12px] !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
      })
    } finally {
      setIsResettingPassword(false)
    }
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
    isResettingPassword,
    onAddModeSecurityTransferSucceeded,
  }
}

/**
 * Local UI state for the Employee / Login Details tab (file label, password visibility).
 */
export function useEmployeeLoginDetailsUi(userId?: string | null) {
  const { watch, setValue } = useFormContext<UserModuleFormValues>()
  const jobDutyFromForm = watch("jobDutyStatement") || ""
  const [localFileLabel, setLocalFileLabel] = useState("")
  
  const selectedJobDutyFile = localFileLabel || jobDutyFromForm
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)

  const uploadMutation = useUploadUserDocument()

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev)
  }, [])

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setIsConfirmPasswordVisible((prev) => !prev)
  }, [])

  const onJobDutyFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return
      setLocalFileLabel(file.name)
      setValue("jobDutyStatement", file.name, { shouldDirty: true })
      setValue("jobDutyFile", file, { shouldDirty: true })

      if (userId) {
        try {
          const res = await uploadMutation.mutateAsync({
            userId,
            docType: "job_duty",
            file,
          })
          // Update the ID if the upload returned one
          if (res?.data?.id) {
            setValue("jobDutyFileId", res.data.id)
          }
        } catch (err) {
          // Toast is handled by mutation
        }
      }
    },
    [userId, uploadMutation, setValue],
  )

  const onDeleteJobDutyFile = useCallback(async () => {
    const fileId = watch("jobDutyFileId")
    if (fileId) {
      try {
        await api.delete(`/user-documents/${fileId}`)
        toast.success("Document deleted successfully")
      } catch (error) {
        console.error("Delete failed", error)
        const message = error instanceof Error ? error.message : "Failed to delete document"
        toast.error(message)
        return
      }
    } else {
      toast.success("Document deleted successfully")
    }
    setLocalFileLabel("")
    setValue("jobDutyStatement", "", { shouldDirty: true })
    setValue("jobDutyFile", null, { shouldDirty: true })
    setValue("jobDutyFileId", null, { shouldDirty: true })
  }, [watch, setValue])

  const onPreviewJobDutyFile = useCallback(async () => {
    const fileId = watch("jobDutyFileId")
    const localFile = watch("jobDutyFile")
    if (fileId) {
      try {
        const blob = await api.get<Blob>(`/user-documents/${fileId}/download`)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = watch("jobDutyStatement") || "job-duty-statement"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Download failed", error)
        const message = error instanceof Error ? error.message : "Failed to download job duty statement"
        toast.error(message)
      }
    } else if (localFile instanceof File) {
      try {
        const url = window.URL.createObjectURL(localFile)
        const a = document.createElement("a")
        a.href = url
        a.download = localFile.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("Preview failed", error)
        toast.error("Failed to preview local file")
      }
    } else {
      toast.info("No file available to preview")
    }
  }, [watch])

  return {
    selectedJobDutyFile,
    isPasswordVisible,
    isConfirmPasswordVisible,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    onJobDutyFileChange,
    onDeleteJobDutyFile,
    onPreviewJobDutyFile,
    isUploading: uploadMutation.isPending,
  }
}
