import type { MimicSession } from "./types"

/**
 * In-memory storage for the mimic session.
 * By using memory instead of sessionStorage, the mimic state is lost on browser refresh,
 * effectively "committing" the session as the target user.
 */
let memoryMimicSession: MimicSession | null = null

export function getStoredMimicSession(): MimicSession | null {
  return memoryMimicSession
}

export function setStoredMimicSession(value: MimicSession): void {
  memoryMimicSession = value
}

export function clearStoredMimicSession(): void {
  memoryMimicSession = null
}

