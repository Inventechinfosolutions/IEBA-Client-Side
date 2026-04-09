/**
 * Profile feature HTTP layer. Delegates to `features/user/api` (`GET/PUT /users/:id`)
 * because profile uses the same user-details resource as the rest of the app.
 */
import { apiGetUserDetails, apiUpdateUser } from "@/features/user/api"
import { phoneDigitsOnly } from "@/features/user/add-employee/schemas"
import type { EmergencyContactUpsertDto, UpdateUserRequestDto } from "@/features/user/types"
import { contactsPayloadForUpdate } from "@/features/user/utility/mapUserDetailsToForm"

import type { ProfileDetailData, ProfileDetailFormValues, UpdateProfileDetailInput } from "./types"
import { mapUserDetailsToProfileDetailData } from "./utils/mapUserDetailsToProfileDetail"

function clampPositionName(raw: string): string {
  const t = raw.trim()
  if (t.length <= 255) return t
  return t.slice(0, 255)
}

function buildPrimaryPhoneDigits(areaCode: string, telephoneNumber: string): string {
  const a = phoneDigitsOnly(areaCode)
  const t = phoneDigitsOnly(telephoneNumber)
  if (a.length === 3 && t.length === 7) return `${a}${t}`
  if (t.length === 10) return t
  return `${a}${t}`
}

function buildEmergencyContactPayload(values: ProfileDetailFormValues): EmergencyContactUpsertDto {
  const ec = values.emergencyContact
  const phoneDigits = buildPrimaryPhoneDigits(ec.areaCode, ec.telephoneNumber)
  const areaDigits = phoneDigitsOnly(ec.areaCode).slice(0, 5)
  return {
    firstName: ec.firstName.trim(),
    lastName: ec.lastName.trim(),
    countryCode: areaDigits || phoneDigits.slice(0, 3),
    phone: phoneDigits,
    relationship: ec.relationship,
  }
}

export async function getProfileDetail(userId: string): Promise<ProfileDetailData> {
  const trimmed = userId.trim()
  if (!trimmed) {
    throw new Error("User id is required to load profile details.")
  }
  const details = await apiGetUserDetails(trimmed)
  return mapUserDetailsToProfileDetailData(details)
}

export async function saveProfileDetail(input: UpdateProfileDetailInput): Promise<ProfileDetailData> {
  const { id, values, persist } = input
  const phoneDigits = buildPrimaryPhoneDigits(values.areaCode, values.telephoneNumber)

  const payload: UpdateUserRequestDto = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    employeeId: values.onRecords.employeeId.trim(),
    positionName: clampPositionName(values.onRecords.positionId),
    contacts: contactsPayloadForUpdate(phoneDigits),
    emergencyContact: buildEmergencyContactPayload(values),
  }

  const pid = persist?.primarySupervisorUserId?.trim()
  const bid = persist?.backupSupervisorUserId?.trim()
  if (pid) payload.primarySupervisorId = pid
  if (bid) payload.backupSupervisorId = bid

  const loc = persist?.locationId
  if (loc != null && Number.isInteger(loc) && loc >= 1) {
    payload.locationId = loc
  }

  if (persist?.jobClassificationIds !== undefined) {
    payload.jobClassificationIds = persist.jobClassificationIds
  }

  await apiUpdateUser(id, payload)
  const details = await apiGetUserDetails(id)
  return mapUserDetailsToProfileDetailData(details)
}
