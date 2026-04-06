import type { UserDetailsDto, UserModuleFormValues } from "../types"

function roleAssignmentsFromDetails(details: UserDetailsDto): string[] {
  if (details.departmentsRoles?.length) {
    const names = details.departmentsRoles
      .map((dr) => dr.role?.name?.trim())
      .filter((n): n is string => Boolean(n))
    return names.length ? [...new Set(names)] : ["User"]
  }
  if (details.roles?.length) {
    const names = details.roles.map((r) => r.name?.trim()).filter((n): n is string => Boolean(n))
    return names.length ? names : ["User"]
  }
  return ["User"]
}

function phoneFromEmergency(details: UserDetailsDto): string | undefined {
  const ec = details.emergencyContact
  if (!ec?.phone?.trim()) return undefined
  const cc = (ec.countryCode ?? "").trim()
  const p = ec.phone.trim()
  if (cc && !p.startsWith("+") && !p.startsWith(cc)) {
    return `${cc}${p}`
  }
  return p
}

/**
 * Applies GET /users/:id/details onto the current form; keeps passwords and fields the API omits.
 */
export function mergeUserDetailsIntoFormValues(
  details: UserDetailsDto,
  previous: UserModuleFormValues
): UserModuleFormValues {
  const login = details.user?.loginId?.trim() ?? previous.loginId
  const claiming =
    details.departments?.find((d) => d.name?.trim())?.name?.trim() ?? previous.claimingUnit
  const multiJoined = (details.multiCodes ?? []).filter(Boolean).join(", ")
  const active =
    typeof details.status === "string" && details.status.trim() !== ""
      ? details.status.toLowerCase() === "active"
      : previous.active

  return {
    ...previous,
    employeeNo: String(details.employeeId ?? details.id ?? previous.employeeNo).trim(),
    firstName: details.firstName?.trim() || previous.firstName,
    lastName: details.lastName?.trim() || previous.lastName,
    location: details.location?.name?.trim() ?? previous.location,
    phone: phoneFromEmergency(details) ?? previous.phone,
    loginId: login,
    emailAddress: login,
    jobClassification: details.positionName?.trim() ?? previous.jobClassification,
    claimingUnit: claiming,
    tsMinDay: details.tsmins != null ? String(details.tsmins) : previous.tsMinDay,
    allowMultiCodes: details.allowMultiCodes,
    assignedMultiCodes: multiJoined || previous.assignedMultiCodes,
    roleAssignments: roleAssignmentsFromDetails(details),
    active,
  }
}
