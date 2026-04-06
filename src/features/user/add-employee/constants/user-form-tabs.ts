import type { UserModuleFormValues, AddEmployeeFormTab } from "../types"

export const addEmployeeTabFieldKeys: Record<
  AddEmployeeFormTab,
  (keyof UserModuleFormValues)[]
> = {
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
  security: ["roleAssignments", "supervisorApportioning", "clientAdmin"],
  supervisor: ["supervisorPrimary", "supervisorSecondary"],
  timeStudy: ["tsMinDay", "programs", "activities"],
}

export type AddEmployeeTabDefinition = {
  id: AddEmployeeFormTab
  label: string
}

export const addEmployeeTabs: AddEmployeeTabDefinition[] = [
  { id: "employee", label: "Employee/Login Details" },
  { id: "security", label: "Security/Assignments" },
  { id: "supervisor", label: "Supervisor Assignments" },
  { id: "timeStudy", label: "Time Study Assignments" },
]

export const orderedAddEmployeeTabs: AddEmployeeFormTab[] = addEmployeeTabs.map((tab) => tab.id)
