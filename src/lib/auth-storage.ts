import type { User } from "@/contexts/types"

const USER_KEY = "ieba_user"
const PASSWORD_CHANGED_PREFIX = "ieba_password_changed:"

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

