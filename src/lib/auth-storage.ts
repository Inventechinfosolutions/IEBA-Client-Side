import type { User } from "@/contexts/types"

const USER_KEY = "ieba_user"
const PASSWORD_CHANGED_PREFIX = "ieba_password_changed:"
/** Set on manual logout so startup/refresh does not restore from cookie. */
const EXPLICIT_LOGOUT_KEY = "ieba_explicit_logout"

export function markExplicitLogout(): void {
  sessionStorage.setItem(EXPLICIT_LOGOUT_KEY, "1")
}

export function clearExplicitLogout(): void {
  sessionStorage.removeItem(EXPLICIT_LOGOUT_KEY)
}

export function wasExplicitLogout(): boolean {
  return sessionStorage.getItem(EXPLICIT_LOGOUT_KEY) === "1"
}

export function getStoredUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setStoredUser(user: User): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  sessionStorage.removeItem(USER_KEY)
}

export function hasPasswordBeenChangedForUser(userId: string): boolean {
  return localStorage.getItem(`${PASSWORD_CHANGED_PREFIX}${userId}`) === "true"
}

export function markPasswordChangedForUser(userId: string): void {
  localStorage.setItem(`${PASSWORD_CHANGED_PREFIX}${userId}`, "true")
}

