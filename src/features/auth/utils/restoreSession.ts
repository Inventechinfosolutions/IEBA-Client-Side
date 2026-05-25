import type { User } from "@/contexts/types"
import { getUserDetails } from "../api/getUserDetails"
import { refreshSession } from "../api/refresh"
import { buildAuthUserFromDetails } from "./buildAuthUser"

/**
 * Restore dashboard session from httpOnly refresh cookie (page reload).
 */
export async function restoreSessionFromRefreshCookie(): Promise<User | null> {
  try {
    const refreshed = await refreshSession()
    const details = await getUserDetails(refreshed.userId)
    return buildAuthUserFromDetails(refreshed.userId, refreshed.loginId, details)
  } catch {
    return null
  }
}
