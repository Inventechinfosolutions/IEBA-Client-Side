import type { UseFormSetValue } from "react-hook-form"

import type { SecurityDepartmentRolesQueryResult, UserModuleFormValues } from "../types"
import { roleNamesFromSecuritySnapshots } from "./parseSecurityDepartmentRoles"

/** Applies GET /departments/assignedDepartment/roles onto the Security/Assignments form fields. */
export function syncSecurityAssignmentsForm(
  setValue: UseFormSetValue<UserModuleFormValues>,
  data: SecurityDepartmentRolesQueryResult,
) {
  const snapshots = data.assignedSnapshots
  setValue("securityAssignedSnapshots", snapshots, {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("roleAssignments", roleNamesFromSecuritySnapshots(snapshots), {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
}
