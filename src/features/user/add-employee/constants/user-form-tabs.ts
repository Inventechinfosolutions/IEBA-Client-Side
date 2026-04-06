import type { AddEmployeeFormTab, AddEmployeeTabDefinition, UserModuleFormValues } from "../types"

export const addEmployeeTabFieldKeys: Record<
  AddEmployeeFormTab,
  (keyof UserModuleFormValues)[]
> = {
  employee: [
    "employeeNo",
    "firstName",
    "lastName",
    "phone",
    "loginId",
    "password",
    "confirmPassword",
    "jobClassification",
    "claimingUnit",
  ],
  security: ["roleAssignments", "supervisorApportioning", "clientAdmin"],
  supervisor: [
    "supervisorPrimary",
    "supervisorSecondary",
    "supervisorPrimaryId",
    "supervisorSecondaryId",
  ],
  timeStudy: ["tsMinDay", "programs", "activities"],
}

export const addEmployeeTabs: AddEmployeeTabDefinition[] = [
  { id: "employee", label: "Employee/Login Details" },
  { id: "security", label: "Security/Assignments" },
  { id: "supervisor", label: "Supervisor Assignments" },
  { id: "timeStudy", label: "Time Study Assignments" },
]

export const orderedAddEmployeeTabs: AddEmployeeFormTab[] = addEmployeeTabs.map((tab) => tab.id)
