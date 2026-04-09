import { useQuery } from "@tanstack/react-query"

import { getAllDepartments } from "@/features/department/api/departments"

import { scheduleTimeStudyKeys } from "../keys"

/** Active departments for resolving UI department slug → numeric id for RMTS APIs. */
export function useGetScheduleTimeStudyDepartments() {
  return useQuery({
    queryKey: scheduleTimeStudyKeys.departments(),
    queryFn: () => getAllDepartments({ status: "active" }),
    staleTime: 60_000,
  })
}
