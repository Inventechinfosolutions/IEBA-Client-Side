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
  UpdateProfileDetailPartialInput,
  UploadProfileImageResponse,
  UploadProfileImageInput,
} from "./types"
import { mapUserDetailsToProfileDetailData } from "./utils/mapUserDetailsToProfileDetail"


function buildPrimaryPhoneDigits(areaCode: string, telephoneNumber: string): string {
  const a = phoneDigitsOnly(areaCode)
  const t = phoneDigitsOnly(telephoneNumber)
  if (a.length === 3 && t.length === 7) return `${a}${t}`
  if (t.length === 10) {
    if (a.length === 3) {
      return `${a}${t.slice(3)}`
    }
    return t
  }
  return `${a}${t}`
}

function buildEmergencyContactPayload(values: ProfileDetailFormValues): EmergencyContactUpsertDto {
  const ec = values.emergencyContact
  const areaCode = ec.areaCode ?? ""
  const telephoneNumber = ec.telephoneNumber ?? ""
  const phoneDigits = buildPrimaryPhoneDigits(areaCode, telephoneNumber)
  const areaDigits = phoneDigitsOnly(areaCode).slice(0, 5)
  return {
    firstName: (ec.firstName ?? "").trim(),
    lastName: (ec.lastName ?? "").trim(),
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

export async function updateProfileDetail(
  input: UpdateProfileDetailInput | UpdateProfileDetailPartialInput
): Promise<ProfileDetailData> {
  const { id, values, persist } = input

  const payload: UpdateUserRequestDto = {}

  // Only include firstName/lastName if they were changed
  if (values.firstName !== undefined) payload.firstName = values.firstName.trim()
  if (values.lastName !== undefined) payload.lastName = values.lastName.trim()

  // Only include phone/contacts if areaCode or telephoneNumber changed
  if (values.areaCode !== undefined || values.telephoneNumber !== undefined) {
    const areaCode = values.areaCode ?? ""
    const telephoneNumber = values.telephoneNumber ?? ""
    const phoneDigits = buildPrimaryPhoneDigits(areaCode, telephoneNumber)
    payload.contacts = contactsPayloadForUpdate(phoneDigits)
  }



  // Only include emergencyContact if it changed
  if (values.emergencyContact !== undefined) {
    payload.emergencyContact = buildEmergencyContactPayload(
      values as ProfileDetailFormValues
    )
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
