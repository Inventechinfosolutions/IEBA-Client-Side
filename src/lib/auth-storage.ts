import type { User } from "@/contexts/types"

const USER_KEY = "ieba_user"

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

