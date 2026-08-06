import type { User } from "@/contexts/types"

export function isGlobalAdminLogin(user: User | null): boolean {
  if (!user) return false

  const perms = user.permissions ?? []
  const hasSuperAdmin = Array.isArray(perms) && perms.includes("superadmin:all")
  const hasMimicPerm = Array.isArray(perms) && perms.includes("user:mimic")

  return hasSuperAdmin || hasMimicPerm
}
