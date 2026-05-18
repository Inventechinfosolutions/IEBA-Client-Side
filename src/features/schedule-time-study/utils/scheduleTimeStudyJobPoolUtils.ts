import type { JobPoolRow } from "@/features/job-pool/types"

export type JobPoolUserProfile = {
  id: string
  name?: string
  firstName?: string
  lastName?: string
}

export function jobPoolUserDisplayLabel(
  user: JobPoolUserProfile,
  departmentUsers?: ReadonlyArray<{
    id: string
    name?: string | null
    firstName?: string | null
    lastName?: string | null
    user?: { loginId?: string | null } | null
  }>,
): string {
  const lastFirst = `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim()
  const firstLast = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
  const deptUser = departmentUsers?.find((du) => du.id === user.id)

  return (
    lastFirst ||
    firstLast ||
    (user.name ?? "").trim() ||
    (deptUser?.name ?? "").trim() ||
    `${deptUser?.lastName ?? ""} ${deptUser?.firstName ?? ""}`.trim() ||
    (deptUser?.user?.loginId ?? "").trim() ||
    user.id
  )
}

export function isJobPoolFullySelected(
  jobPoolId: string,
  userIdsInPool: string[],
  selectedJobPoolIds: string[],
  selectedJobPoolUserIds: string[],
): boolean {
  if (selectedJobPoolIds.includes(jobPoolId)) return true
  if (userIdsInPool.length === 0) return false
  return userIdsInPool.every((id) => selectedJobPoolUserIds.includes(id))
}

export function isJobPoolUserSelected(
  userId: string,
  jobPoolId: string,
  selectedJobPoolIds: string[],
  selectedJobPoolUserIds: string[],
): boolean {
  return selectedJobPoolUserIds.includes(userId) || selectedJobPoolIds.includes(jobPoolId)
}

/** Sort job pools for stable tree display. */
export function sortJobPoolsForDisplay(jobPools: JobPoolRow[]): JobPoolRow[] {
  return [...jobPools].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  )
}
