import { useQuery } from "@tanstack/react-query"
import { fetchDepartmentUserPicklist } from "@/features/user/api/department-users/departmentUserApi"
import { costPoolKeys } from "../keys"
import type { CostPoolUserPickRow } from "../types"

export type UserPicklistResponse = {
  users: CostPoolUserPickRow[]
  allowUserOrCostpoolDirect: boolean
}

type UseCostPoolUserPicklistOptions = {
  enabled: boolean
}

export function useCostPoolUserPicklistQuery(
  departmentId: number,
  options: UseCostPoolUserPicklistOptions,
) {
  return useQuery({
    queryKey: [...costPoolKeys.all, "user-picklist", departmentId],
    queryFn: async (): Promise<UserPicklistResponse> => {
      // User specifically requested singular '/department' path
      const res = await fetchDepartmentUserPicklist(String(departmentId))
      // Since we updated fetchDepartmentUsers to match the user's provided structure
      return {
        users: (res.userDetails ?? []).map((u: any) => ({
          userId: String(u.id),
          displayName: [u.firstName, u.lastName].filter(Boolean).join(" ") || String(u.id),
        })),
        allowUserOrCostpoolDirect: res.allowUserOrCostpoolDirect ?? false
      }
    },
    enabled: options.enabled && departmentId > 0,
    staleTime: 5 * 60 * 1000,
  })
}
