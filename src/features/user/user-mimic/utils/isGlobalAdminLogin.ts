import type { User } from "@/contexts/types"

export function isGlobalAdminLogin(user: User | null): boolean {
  const email = (user?.email ?? "").trim().toLowerCase()
  if (!email) return false

  const configured =
    (import.meta.env.VITE_GLOBALADMIN_LOGIN_ID as string | undefined)?.trim().toLowerCase() ??
    ""

  // Primary gate: explicit env var.
  if (configured) return email === configured

  // Fallback (dev/UAT): allow known global admin login or superadmin permission.
  if (email === "superadmin@ieba.com") return true
  const perms = user?.permissions ?? []
  return Array.isArray(perms) && perms.includes("superadmin:all")
}

