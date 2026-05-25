import type { QueryClient } from "@tanstack/react-query"

import { addEmployeeLookupKeys } from "../keys"

/**
 * Refetch GET …/user/programs-with-assignments + …/activities-with-assignments
 * for one department (merged Time Study query).
 */
export async function refetchTsProgramsAndActivitiesForDepartment(
  queryClient: QueryClient,
  userId: string,
  departmentId: number,
): Promise<void> {
  const uid = userId.trim()
  if (!uid || !Number.isFinite(departmentId) || departmentId < 1) return

  await queryClient.refetchQueries({
    queryKey: [
      ...addEmployeeLookupKeys.userProgramsActivities(uid, String(departmentId)),
      "merged",
    ],
    exact: true,
    type: "active",
  })
}
