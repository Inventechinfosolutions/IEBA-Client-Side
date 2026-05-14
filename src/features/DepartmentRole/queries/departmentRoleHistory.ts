import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { departmentRoleKeys } from "../keys"

/** `history_kind` for department role definition audit on `GET /users/department-role-history`. */
export const DEPARTMENT_ROLE_DEFINITION_HISTORY_KIND = "department_role_definition" as const

/** `history_kind` for user ↔ department role assignment audit (User → Security/Assignments). */
export const DEPARTMENT_ROLE_USER_ASSIGNMENT_HISTORY_KIND = "user_assignment" as const

export type DepartmentRoleHistoryRecord = {
  id: number | string
  departmentCode?: string | null
  departmentName?: string | null
  roleName?: string | null
  userId?: string | null
  userName?: string | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
  effective_from?: string | null
  effective_to?: string | null
  createdBy?: string | null
  createdByName?: string | null
  created_by_name?: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedBy?: string | null
  updatedByName?: string | null
  updated_by_name?: string | null
  updatedAt?: string | null
  updated_at?: string | null
}

export type DepartmentRoleHistoryResponse = {
  data: DepartmentRoleHistoryRecord[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export type DepartmentRoleHistoryParams = {
  page?: number
  limit?: number
  departmentCode?: string
  departmentName?: string
  roleName?: string
  /** Sent as `history_kind` (default: department role definition audit). */
  historyKind?: string
  /** Required when `history_kind` is `user_assignment`. */
  userId?: string
}

export function useDepartmentRoleHistoryQuery(params: DepartmentRoleHistoryParams) {
  const {
    page = 1,
    limit = 10,
    departmentCode = "",
    departmentName = "",
    roleName = "",
    historyKind = DEPARTMENT_ROLE_DEFINITION_HISTORY_KIND,
    userId = "",
  } = params

  const isUserAssignment = historyKind.trim() === DEPARTMENT_ROLE_USER_ASSIGNMENT_HISTORY_KIND
  const enabled = !isUserAssignment || userId.trim().length > 0

  return useQuery({
    queryKey: departmentRoleKeys.history({
      page,
      limit,
      departmentCode,
      departmentName,
      roleName,
      historyKind: historyKind || "",
      userId: userId || "",
    }),
    enabled,
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (departmentCode.trim()) searchParams.set("departmentCode", departmentCode.trim())
      if (departmentName.trim()) searchParams.set("departmentName", departmentName.trim())
      if (roleName.trim()) searchParams.set("roleName", roleName.trim())
      const kind = historyKind.trim()
      if (kind) searchParams.set("history_kind", kind)
      const uid = userId.trim()
      if (isUserAssignment) {
        searchParams.set("userId", uid)
      } else if (uid) {
        searchParams.set("userId", uid)
      }

      const res = await api.get<{ data: DepartmentRoleHistoryResponse } | DepartmentRoleHistoryResponse>(
        `/users/department-role-history?${searchParams.toString()}`
      )
      const payload = (res as { data: DepartmentRoleHistoryResponse }).data ?? (res as unknown as DepartmentRoleHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
