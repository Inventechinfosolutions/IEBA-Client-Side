import type { UserContactItemPayload, UserDetailsDto, UserModuleFormValues } from "../types"
import { normalizePhoneForFormDisplay, phoneDigitsOnly } from "../add-employee/schemas"

/** Coerces form/API values into a positive integer `locationId` for create/update DTOs. */
export function normalizeLocationId(raw: unknown): number | undefined {
  if (raw == null) return undefined
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return undefined
  return n
}

const US_CC = "+1"

/** Create: send `contacts` only when form has 10-digit US phone (else primary contact stays email = loginId). */
export function contactsPayloadForCreate(phoneRaw: string | undefined): UserContactItemPayload[] | undefined {
  const digits = phoneDigitsOnly((phoneRaw ?? "").trim())
  if (digits.length === 10) return [{ phone: digits, countryCode: US_CC }]
  return undefined
}

/**
 * Update: always send `contacts` — 10 digits → PHONE row; `[]` → backend uses email + loginId.
 */
export function contactsPayloadForUpdate(phoneRaw: string | undefined): UserContactItemPayload[] {
  const digits = phoneDigitsOnly((phoneRaw ?? "").trim())
  if (digits.length === 10) return [{ phone: digits, countryCode: US_CC }]
  return []
}

/** Matches GET /departments/user/roles-unassigned item ids (`deptId-roleId`). */
function securitySnapshotsFromDepartmentRoles(
  details: UserDetailsDto,
): UserModuleFormValues["securityAssignedSnapshots"] {
  const rows = details.departmentsRoles ?? []
  const out: UserModuleFormValues["securityAssignedSnapshots"] = []
  const seen = new Set<string>()
  for (const dr of rows) {
    const deptId = dr.departmentId
    const roleId = dr.roleId
    const roleName = dr.role?.name?.trim() ?? ""
    const deptName = dr.department?.name?.trim() ?? ""
    if (
      !Number.isFinite(deptId) ||
      deptId < 1 ||
      !Number.isFinite(roleId) ||
      roleId < 1 ||
      !roleName ||
      !deptName
    ) {
      continue
    }
    const id = `${deptId}-${roleId}`
    if (seen.has(id)) continue
    seen.add(id)
    out.push({ id, name: roleName, departmentId: deptId, department: deptName })
  }
  return out.sort((a, b) => {
    const d = a.department.localeCompare(b.department, undefined, { sensitivity: "base" })
    if (d !== 0) return d
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  })
}

function roleAssignmentsFromDetails(details: UserDetailsDto): string[] {
  if (details.departmentsRoles?.length) {
    const names = details.departmentsRoles
      .map((dr) => dr.role?.name?.trim())
      .filter((n): n is string => Boolean(n))
    return names.length ? [...new Set(names)] : []
  }
  if (details.roles?.length) {
    const names = details.roles.map((r) => r.name?.trim()).filter((n): n is string => Boolean(n))
    return names.length ? names : []
  }
  return []
}

function phoneFromEmergency(details: UserDetailsDto): string | undefined {
  const ec = details.emergencyContact
  if (!ec?.phone?.trim()) return undefined
  const cc = (ec.countryCode ?? "").trim()
  const p = ec.phone.trim()
  const withCc =
    cc && !p.startsWith("+") && !p.startsWith(cc) ? `${cc}${p}` : p
  const digits = phoneDigitsOnly(withCc)
  if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
    return normalizePhoneForFormDisplay(withCc)
  }
  return withCc.trim()
}

/** Primary USER contact when API returns `contacts[].type === "phone"` (and similar). */
function phoneFromUserContacts(details: UserDetailsDto): string | undefined {
  const rows = details.contacts ?? []
  for (const c of rows) {
    const t = (c.type ?? "").toLowerCase()
    if (t !== "phone" && t !== "mobile" && t !== "personal_phone") continue
    const raw = (c.phone ?? "").trim()
    if (!raw) continue
    const digits = phoneDigitsOnly(raw)
    if (digits.length === 10) return normalizePhoneForFormDisplay(raw)
    return raw
  }
  return undefined
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
    locationId: details.location?.id ?? previous.locationId,
    phone:
      phoneFromUserContacts(details) ?? phoneFromEmergency(details) ?? previous.phone,
    loginId: login,
    emailAddress: login,
    jobClassification: details.positionName?.trim() ?? previous.jobClassification,
    claimingUnit: claiming,
    tsMinDay: details.tsmins != null ? String(details.tsmins) : previous.tsMinDay,
    spmp: typeof details.spmp === "boolean" ? details.spmp : previous.spmp,
    multilingual:
      typeof details.multilingual === "boolean" ? details.multilingual : previous.multilingual,
    allowMultiCodes: details.allowMultiCodes,
    assignedMultiCodes: multiJoined || previous.assignedMultiCodes,
    roleAssignments: roleAssignmentsFromDetails(details),
    securityAssignedSnapshots: securitySnapshotsFromDepartmentRoles(details),
    active,
    supervisorPrimary: details.primarySupervisor?.name?.trim() ?? previous.supervisorPrimary,
    supervisorSecondary: details.backupSupervisor?.name?.trim() ?? previous.supervisorSecondary,
    supervisorPrimaryId: details.primarySupervisor?.id?.trim() ?? previous.supervisorPrimaryId,
    supervisorSecondaryId: details.backupSupervisor?.id?.trim() ?? previous.supervisorSecondaryId,
  }
}
