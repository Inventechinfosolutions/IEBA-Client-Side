import { useQuery } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import { getAllDepartments, getDepartments, getDepartmentsAll } from "../api/departments"
import type { GetAllDepartmentsParams } from "../types"

export function useGetDepartments(
  params: {
    status: "active" | "inactive"
    page: number
    limit: number
    /**
     * Optional client-driven search string.
     * Backend rejects unknown params, so search is implemented by fetching all pages and filtering client-side.
     */
    search?: string
    sort?: "ASC" | "DESC"
    userId?: string
  },
  options?: {
    enabled?: boolean
  },
) {
  return useQuery({
    queryKey: [...departmentKeys.lists(), params],
    queryFn: () => getDepartments(params),
    // Server is source of truth — never show stale list after DB changes.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    enabled: options?.enabled ?? true,
  })
}

export function useGetAllDepartments(
  params: GetAllDepartmentsParams = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: departmentKeys.allUnpaginated({
      status: params.status,
      sort: params.sort,
      search: params.search,
    }),
    queryFn: () => getAllDepartments(params),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    enabled: options?.enabled ?? true,
  })
}

export function useGetDepartmentsAll(
  params?: { status?: string; search?: string; sort?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...departmentKeys.all, "all", params],
    queryFn: () => getDepartmentsAll(params),
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  })
}
