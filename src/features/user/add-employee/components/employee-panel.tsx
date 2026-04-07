import { FormProvider } from "react-hook-form"

import { Button } from "@/components/ui/button"

import { useAddEmployeeForm } from "../hooks/use-add-employee-form"
import type { AddEmployeeFormPanelProps } from "../types"

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
  } = useAddEmployeeForm({ mode, initialValues, onSave })

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
          {activeTab === "employee" ? <EmployeeLoginDetailsSection isEditMode={isEditMode} /> : null}
          {activeTab === "security" ? (
            <SecurityAssignmentsPanel
              mode={mode}
              securityContextUserId={securityContextUserId ?? null}
              allowUnassignedQueryWithoutUserId={mode === "add"}
            />
          ) : null}
          {activeTab === "supervisor" ? (
            <SupervisorAssignmentsPanel />
          ) : null}
          {activeTab === "timeStudy" ? (
            <TimeStudyAssignmentsPanel
              key={`time-study-${mode}-${securityContextUserId ?? "new"}`}
              mode={mode}
              timeStudyContextUserId={securityContextUserId ?? null}
            />
          ) : null}

          <div className="mt-5 flex items-center justify-end gap-3">
            <Button
              type="submit"
              className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
            >
              Save
            </Button>
            {!isLastTab && !(isEditMode && activeTab === "employee") ? (
              <Button
                type="button"
                onClick={handleNext}
                className="h-9 min-w-[72px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
              >
                Next
              </Button>
            ) : null}
            {isEditMode && activeTab === "employee" ? (
              <Button
                type="button"
                onClick={handlePasswordReset}
                className="h-9 min-w-[120px] cursor-pointer rounded-[8px] bg-[#6C5DD3] px-5 text-[12px] text-white hover:bg-[#6C5DD3]"
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
