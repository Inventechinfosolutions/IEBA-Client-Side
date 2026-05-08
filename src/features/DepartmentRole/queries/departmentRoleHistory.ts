import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { departmentRoleKeys } from "../keys"

export type DepartmentRoleHistoryRecord = {
  id: number | string
  departmentCode: string | null
  departmentName: string | null
  roleName: string | null
  userId: string | null
  userName: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  [key: string]: unknown
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
}

export function useDepartmentRoleHistoryQuery(params: DepartmentRoleHistoryParams) {
  const { 
    page = 1, 
    limit = 10, 
    departmentCode = "", 
    departmentName = "", 
    roleName = "" 
  } = params

  return useQuery({
    queryKey: departmentRoleKeys.history({ page, limit, departmentCode, departmentName, roleName }),
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set("page", String(page))
      searchParams.set("limit", String(limit))
      if (departmentCode.trim()) searchParams.set("departmentCode", departmentCode.trim())
      if (departmentName.trim()) searchParams.set("departmentName", departmentName.trim())
      if (roleName.trim()) searchParams.set("roleName", roleName.trim())

      const res = await api.get<{ data: DepartmentRoleHistoryResponse } | DepartmentRoleHistoryResponse>(
        `/users/department-role-history?${searchParams.toString()}`
      )
      const payload = (res as { data: DepartmentRoleHistoryResponse }).data ?? (res as unknown as DepartmentRoleHistoryResponse)
      return payload
    },
    staleTime: 0,
  })
}
