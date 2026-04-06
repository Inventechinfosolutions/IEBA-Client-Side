import { phoneDigitsOnly } from "../add-employee/schemas"

/** Matches backend `CreateUserContactItemDto` / update `contacts`. */
export type UserContactItemPayload = { phone?: string; countryCode?: string }

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
