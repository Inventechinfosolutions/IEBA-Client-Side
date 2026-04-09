import type { MimicSession } from "./types"

const MIMIC_KEY = "ieba_mimic_session"

export function getStoredMimicSession(): MimicSession | null {
  try {
    const raw = sessionStorage.getItem(MIMIC_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MimicSession
  } catch {
    return null
  }
}

export function setStoredMimicSession(value: MimicSession): void {
  sessionStorage.setItem(MIMIC_KEY, JSON.stringify(value))
}

export function clearStoredMimicSession(): void {
  sessionStorage.removeItem(MIMIC_KEY)
}

