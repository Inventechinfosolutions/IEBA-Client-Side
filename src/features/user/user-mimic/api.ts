import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

import type { MimicUserBody, MimicUserResult } from "./types"

type MimicEnvelope = ApiResponseDto<{
  accessToken?: string
  access_token?: string
  token?: string
  userId?: string
  user_id?: string
}>

export async function apiMimicUser(body: MimicUserBody): Promise<MimicUserResult> {
  const res = await api.post<MimicEnvelope>("/users/mimic-user", body)
  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to mimic user")
  }
  const d = res.data
  const accessToken = (d.accessToken ?? d.access_token ?? d.token ?? "").trim()
  const userId = String(d.userId ?? d.user_id ?? "").trim()
  if (!accessToken || !userId) {
    throw new Error("Invalid mimic-user response: missing accessToken or userId")
  }
  return { accessToken, userId }
}

