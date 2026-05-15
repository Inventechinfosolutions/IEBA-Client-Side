import type { UseFormSetValue } from "react-hook-form"

import type { UserDetailsTab2Dto, UserModuleFormValues } from "../types"

export function parseUserDetailsTab2(payload: Record<string, unknown>): UserDetailsTab2Dto {
  const departmentsRoles = Array.isArray(payload.departmentsRoles)
    ? (payload.departmentsRoles as UserDetailsTab2Dto["departmentsRoles"])
    : []

  return {
    id: String(payload.id ?? "").trim(),
    firstName: String(payload.firstName ?? "").trim(),
    lastName: String(payload.lastName ?? "").trim(),
    name: String(payload.name ?? "").trim(),
    departmentsRoles,
  }
}

/** Applies GET /users/:id/details/required?method=tab2 onto Security tab form fields. */
export function syncSecurityTab2Form(
  setValue: UseFormSetValue<UserModuleFormValues>,
  tab2: UserDetailsTab2Dto,
) {
  const supervisorApportioning = tab2.departmentsRoles.some((dr) => dr.apportioningRequired === true)
  const apportioningAllocations = tab2.departmentsRoles.reduce<Record<string, string>>((acc, dr) => {
    if (dr.apportioning != null) {
      acc[String(dr.departmentId)] = String(dr.apportioning)
    }
    return acc
  }, {})

  setValue("supervisorApportioning", supervisorApportioning, {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("apportioningAllocations", apportioningAllocations, {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
}

export function apportioningFieldsFromTab2(
  tab2: UserDetailsTab2Dto,
): Pick<UserModuleFormValues, "supervisorApportioning" | "apportioningAllocations"> {
  return {
    supervisorApportioning: tab2.departmentsRoles.some((dr) => dr.apportioningRequired === true),
    apportioningAllocations: tab2.departmentsRoles.reduce<Record<string, string>>((acc, dr) => {
      if (dr.apportioning != null) {
        acc[String(dr.departmentId)] = String(dr.apportioning)
      }
      return acc
    }, {}),
  }
}
