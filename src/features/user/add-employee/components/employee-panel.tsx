import { FormProvider } from "react-hook-form"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import { useAddEmployeeForm } from "../hooks/use-add-employee-form"
import type { AddEmployeeFormPanelProps, AddEmployeeFormTab } from "../types"

import { EmployeeLoginDetailsSection } from "../employee-login-details/employee-login-details-section"
import { SecurityAssignmentsPanel } from "../security-assignments/security-assignments-panel"
import { SupervisorAssignmentsPanel } from "../supervisor-assignments/supervisor-assignments-panel"
import { TimeStudyAssignmentsPanel } from "../time-study-assignments/time-study-assignments-panel"
import { UserFormTabs } from "./user-form-tabs"

export function EmployeePanel({
  mode,
  initialValues,
  securityContextUserId,
  onCancel,
  onSave,
  isSubmitting,
}: AddEmployeeFormPanelProps) {
  const {
    isEditMode,
    methods,
    activeTab,
    disabledTabs,
    isLastTab,
    register,
    handleSave,
    handleNext,
    handleTabChange,
    handlePasswordReset,
    onAddModeSecurityTransferSucceeded,
  } = useAddEmployeeForm({ mode, initialValues, securityContextUserId, onSave })

  const [isTabLoading, setIsTabLoading] = useState(false)

  const onTabChange = (tab: AddEmployeeFormTab) => {
    setIsTabLoading(true)
    handleTabChange(tab)
    setTimeout(() => setIsTabLoading(false), 400)
  }

  const onNextClick = async () => {
    setIsTabLoading(true)
    await handleNext()
    setTimeout(() => setIsTabLoading(false), 400)
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSave} className="relative rounded-[8px] border border-[#d8dce8] bg-white">
        {(isSubmitting || isTabLoading) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[8px] bg-white/60">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        {isEditMode ? (
          <>
            <input type="hidden" {...register("password")} />
            <input type="hidden" {...register("confirmPassword")} />
          </>
        ) : null}

        <UserFormTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          disabledTabs={disabledTabs}
        />

        <div className="min-h-[200px] px-8 pb-8 pt-6">
          {activeTab === "employee" ? (
            <EmployeeLoginDetailsSection
              isEditMode={isEditMode}
              userId={securityContextUserId}
            />
          ) : null}
          {activeTab === "security" ? (
            <SecurityAssignmentsPanel
              mode={mode}
              securityContextUserId={securityContextUserId ?? null}
              allowUnassignedQueryWithoutUserId={mode === "add"}
              onAddModeTransferSucceeded={
                mode === "add" ? onAddModeSecurityTransferSucceeded : undefined
              }
            />
          ) : null}
          {activeTab === "supervisor" ? (
            <SupervisorAssignmentsPanel
              mode={mode}
              supervisorContextUserId={securityContextUserId ?? null}
            />
          ) : null}
          {activeTab === "timeStudy" ? (
            <TimeStudyAssignmentsPanel
              key={`time-study-${mode}-${securityContextUserId ?? "new"}`}
              mode={mode}
              timeStudyContextUserId={securityContextUserId ?? null}
            />
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            {activeTab !== "timeStudy" ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
              >
                Save
              </Button>
            ) : null}
            {!isLastTab && !(isEditMode && activeTab === "employee") ? (
              <Button
                type="button"
                onClick={onNextClick}
                disabled={isSubmitting}
                className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
              >
                Next
              </Button>
            ) : null}
            {isEditMode && activeTab === "employee" ? (
              <Button
                type="button"
                onClick={handlePasswordReset}
                disabled={isSubmitting}
                className="h-9 min-w-[120px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
              >
                Password Reset
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
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
