import { phoneDigitsOnly } from "@/features/user/add-employee/schemas"
import type { UserDetailsDto } from "@/features/user/types"
import { jobClassificationIdsToMultiSelectString } from "@/features/user/utility/mapUserDetailsToForm"

import { UserRelationship } from "../enums/userrelationship.enum"
import { profileDetailDefaultValues } from "../schemas"
import type { ProfileDetailData, ProfilePersistFields } from "../types"

function normalizeRelationship(raw: string | null | undefined): UserRelationship {
  const t = (raw ?? "").trim().toLowerCase()
  if (!t) return UserRelationship.FATHER
  if ((Object.values(UserRelationship) as string[]).includes(t)) {
    return t as UserRelationship
  }
  return UserRelationship.FATHER
}

function splitUsPhone10(digits: string): { areaCode: string; telephoneNumber: string } {
  const d = digits.replace(/\D/g, "")
  const ten =
    d.length === 11 && d.startsWith("1") ? d.slice(1) : d.length >= 10 ? d.slice(-10) : d
  if (ten.length !== 10) {
    return { areaCode: "", telephoneNumber: "" }
  }
  return { areaCode: ten.slice(0, 3), telephoneNumber: ten }
}

/** Primary USER phone from `contacts` (same rules as employee form). */
function primaryPhoneFromUserDetails(details: UserDetailsDto): {
  areaCode: string
  telephoneNumber: string
} {
  const rows = details.contacts ?? []
  for (const c of rows) {
    const t = (c.type ?? "").toLowerCase()
    if (t !== "phone" && t !== "mobile" && t !== "personal_phone") continue
    const raw = (c.phone ?? "").trim()
    if (!raw) continue
    const digits = phoneDigitsOnly(raw)
    if (digits.length === 10) return splitUsPhone10(digits)
  }
  return { areaCode: "", telephoneNumber: "" }
}

function emergencyContactFromDetails(details: UserDetailsDto) {
  const ec = details.emergencyContact
  if (!ec) {
    return { ...profileDetailDefaultValues.emergencyContact }
  }
  const cc = (ec.countryCode ?? "").trim()
  const p = (ec.phone ?? "").trim()
  const withCc =
    cc && !p.startsWith("+") && !p.startsWith(cc) ? `${cc}${p}` : p
  const digits = phoneDigitsOnly(withCc)
  const ten =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits.length >= 10
        ? digits.slice(-10)
        : digits
  const phone = splitUsPhone10(ten.length === 10 ? ten : "")
  return {
    firstName: (ec.firstName ?? "").trim(),
    lastName: (ec.lastName ?? "").trim(),
    areaCode: phone.areaCode,
    telephoneNumber: phone.telephoneNumber,
    relationship: normalizeRelationship(ec.relationship),
  }
}

function nonEmptyDigitsEmployeeId(employeeId: string | null | undefined, fallbackId: string): string {
  const raw = (employeeId ?? "").trim()
  if (/^\d+$/.test(raw)) return raw
  const fb = fallbackId.replace(/\D/g, "")
  return fb.length > 0 ? fb.slice(0, 20) : "0"
}

function nonEmptyLocationName(details: UserDetailsDto): string {
  const name = details.location?.name?.trim()
  if (name) return name
  return "-"
}

/**
 * Maps GET /users/:id/details onto profile form defaults + fields needed for PUT /users/:id.
 */
export function mapUserDetailsToProfileDetailData(details: UserDetailsDto): ProfileDetailData {
  const primary = primaryPhoneFromUserDetails(details)
  const jcIds = [...new Set((details.jobClassificationIds ?? []).filter((n) => Number.isInteger(n) && n >= 1))].sort(
    (a, b) => a - b,
  )
  const persist: ProfilePersistFields = {
    primarySupervisorUserId: details.primarySupervisor?.id?.trim(),
    backupSupervisorUserId: details.backupSupervisor?.id?.trim(),
    locationId: details.location?.id,
    jobClassificationIds: jcIds,
  }

  const loginId = details.user?.loginId?.trim() ?? ""

  return {
    id: details.id,
    persist,
    firstName: details.firstName?.trim() || "",
    mi: "",
    lastName: details.lastName?.trim() || "",
    areaCode: primary.areaCode,
    telephoneNumber: primary.telephoneNumber,
    emergencyContact: emergencyContactFromDetails(details),
    onRecords: {
      employeeId: nonEmptyDigitsEmployeeId(details.employeeId, details.id),
      positionId: (details.positionName ?? "").trim(),
      jobClassification: jobClassificationIdsToMultiSelectString(jcIds),
      jobDutyStatement: "",
      primarySupervisor: details.primarySupervisor?.name?.trim() ?? "",
      secondarySupervisor: details.backupSupervisor?.name?.trim() ?? "",
      emailLoginId: loginId,
      location: nonEmptyLocationName(details),
    },
  }
}
