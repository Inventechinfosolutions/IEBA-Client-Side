import type { User } from "@/contexts/types"

export type MimicUserBody = {
  targetUserId: string
}

export type MimicUserResult = {
  accessToken: string
  userId: string
}

export type MimicSession = {
  originalToken: string
  originalUser: User
  targetUserId: string
  targetDisplayName: string
  targetLoginId?: string
}

