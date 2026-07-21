import type { User } from "@/contexts/types"
import { hasPasswordBeenChangedForUser } from "@/lib/auth-storage"
import type { UserDetailsDto } from "@/features/user/types"

/**
 * Build app `User` from profile details (login / OTP / session restore).
 */
export function buildAuthUserFromDetails(
  userId: string,
  loginId: string,
  details: UserDetailsDto
): User {
  let permissions = details.allpermissions
  if (!permissions || permissions.length === 0) {
    const all = new Set<string>()
    details.departmentsRoles?.forEach((dr) => {
      dr.permissions?.forEach((p) => all.add(p))
    })
    permissions = Array.from(all)
  }

  const displayName =
    details.name ??
    [details.firstName, details.lastName].filter(Boolean).join(" ")

  const isPasswordChangeRequired =
    !!details.isPasswordChangeRequired &&
    !hasPasswordBeenChangedForUser(userId)

  return {
    id: userId,
    name:
      displayName && displayName.trim().length > 0
        ? displayName
        : loginId.split("@")[0] || loginId,
    firstName: details.firstName,
    lastName: details.lastName,
    email: details.user?.loginId?.trim() || loginId,
    isPasswordChangeRequired: isPasswordChangeRequired ? true : false,
    roles: details.roles?.map((r) => r.name),
    permissions,
    theme: details.theme,
    departmentRoles: details.departmentsRoles?.map((dr) => ({
      departmentId: dr.departmentId,
      roleId: dr.roleId,
      departmentName: dr.department?.name ?? "",
      roleName: dr.role?.name ?? "",
    })),
  }
}
