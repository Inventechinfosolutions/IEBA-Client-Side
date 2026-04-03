import { api } from "@/lib/api"
import type { UserDetails, UserDetailsEnvelope } from "../types"

export async function getUserDetails(userId: string): Promise<UserDetails> {
  const res = await api.get<UserDetailsEnvelope>(`/users/${userId}/details`)

  if (!res) {
    throw new Error("Invalid user details response")
  }

  if (res.success === false) {
    throw new Error(res.message ?? "Failed to load user details")
  }

  if (res.statusCode !== undefined && res.statusCode !== null) {
    const code = Number(res.statusCode)
    if (Number.isFinite(code) && code !== 0) {
      throw new Error(res.message ?? "Failed to load user details")
    }
  }

  if (!res.data) {
    throw new Error("User details payload missing")
  }

  return res.data
}

