import type { AddEmployeeFormTab, AddEmployeeTabDefinition, UserModuleFormValues } from "../types"

export const addEmployeeTabFieldKeys: Record<
  AddEmployeeFormTab,
  (keyof UserModuleFormValues)[]
> = {
  employee: [
    "employeeNo",
    "positionNo",
    "locationId",
    "location",
    "firstName",
    "lastName",
    "phone",
    "loginId",
    "emailAddress",
    "password",
    "confirmPassword",
    "jobClassificationIds",
    "claimingUnit",
    "autoAssignedDepartments",
    "active",
    "pkiUser",
    "spmp",
    "multilingual",
    "jobDutyFile",
  ],
  security: [
    "roleAssignments",
    "supervisorApportioning",
    "clientAdmin",
    "apportioningAllocations",
    "departmentMultiCodes",
    "securityAssignedSnapshots",
  ],
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
