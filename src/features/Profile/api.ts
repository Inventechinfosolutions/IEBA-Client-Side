/**
 * Profile feature HTTP layer. Delegates to `features/user/api` (`GET/PUT /users/:id`)
 * because profile uses the same user-details resource as the rest of the app.
 */
import { apiGetUserDetails, apiUpdateUser } from "@/features/user/api"
import { phoneDigitsOnly } from "@/features/user/add-employee/schemas"
import type { ApiResponseDto, EmergencyContactUpsertDto, UpdateUserRequestDto } from "@/features/user/types"
import { contactsPayloadForUpdate } from "@/features/user/utility/mapUserDetailsToForm"
import { API_BASE_URL } from "@/lib/config"
import { getToken } from "@/lib/api"

import type {
  ProfileApiErrorBody,
  ProfileDetailData,
  ProfileDetailFormValues,
  UpdateProfileDetailInput,
  UploadProfileImageResponse,
  UploadProfileImageInput,
} from "./types"
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

function getApiErrorMessage(errorBody: ProfileApiErrorBody | null, fallbackMessage: string): string {
  const rawMessage = errorBody?.message ?? errorBody?.error
  return Array.isArray(rawMessage) ? rawMessage.join(", ") : (rawMessage ?? fallbackMessage)
}

export async function fetchProfileDetail(userId: string): Promise<ProfileDetailData> {
  const trimmed = userId.trim()
  if (!trimmed) {
    throw new Error("User id is required to load profile details.")
  }
  const details = await apiGetUserDetails(trimmed)
  return mapUserDetailsToProfileDetailData(details)
}

export async function updateProfileDetail(input: UpdateProfileDetailInput): Promise<ProfileDetailData> {
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

export type { UploadProfileImageInput } from "./types"

export async function uploadProfileImage(input: UploadProfileImageInput): Promise<UploadProfileImageResponse> {
  const userId = input.userId.trim()
  if (!userId) throw new Error("User id is required to upload profile image.")
  const dataUrl = input.dataUrl.trim()
  if (!dataUrl) throw new Error("Image payload is required.")

  const token = getToken()
  const url = `${API_BASE_URL}/userprofile/${encodeURIComponent(userId)}/profile-image`

  // Convert data URL → Blob without inflating JSON body size.
  const blob = await fetch(dataUrl).then(async (r) => await r.blob())
  const file = new File([blob], input.fileName?.trim() || `profile-${userId}.png`, {
    type: blob.type || "image/png",
  })

  const form = new FormData()
  form.append("file", file)

  const res = await fetch(url, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ProfileApiErrorBody | null
    throw new Error(getApiErrorMessage(errorBody, res.statusText))
  }

  const body = (await res.json().catch(() => null)) as ApiResponseDto<{ storageKey: string }> | null
  if (!body?.success || !body.data?.storageKey) {
    throw new Error(body?.message ?? "Failed to upload profile image")
  }
  return body.data
}

/**
 * Loads current profile image as a browser object URL.
 * Returns `null` when the backend has no image (404).
 */
export async function getProfileImageObjectUrl(userId: string): Promise<string | null> {
  const id = userId.trim()
  if (!id) throw new Error("User id is required to load profile image.")

  const token = getToken()
  const url = `${API_BASE_URL}/userprofile/${encodeURIComponent(id)}/profile-image?t=${Date.now()}`
  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  })

  if (res.status === 404) return null
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "Failed to load profile image")
  }

  const blob = await res.blob()
  if (blob.size === 0) return null
  return URL.createObjectURL(blob)
}

export async function deleteProfileImage(userId: string): Promise<void> {
  const id = userId.trim()
  if (!id) throw new Error("User id is required to delete profile image.")

  const token = getToken()
  const url = `${API_BASE_URL}/userprofile/${encodeURIComponent(id)}/profile-image`
  const res = await fetch(url, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (res.status === 204) return
  if (!res.ok) {
    const errorBody = (await res.json().catch(() => null)) as ProfileApiErrorBody | null
    throw new Error(getApiErrorMessage(errorBody, res.statusText))
  }
}
