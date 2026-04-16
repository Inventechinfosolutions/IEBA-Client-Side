import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { getUserDetails } from "@/features/auth/api/getUserDetails"

import { listItemToTableRow } from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { useCostPoolListQuery } from "../queries/getCostPools"
import type { CostPoolFilterFormValues, CostPoolPagination, CostPoolRow } from "../types"

const DEFAULT_PAGINATION: CostPoolPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
}

export function useCostPools(filters: CostPoolFilterFormValues) {
  const { user } = useAuth()
  const { isSuperAdmin, isDepartmentAdmin } = usePermissions()
  const [pagination, setPagination] = useState<CostPoolPagination>(DEFAULT_PAGINATION)

  // Locally fetch user details to get the current assigned departments
  const { data: userDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["user-details-local", user?.id],
    queryFn: () => (user?.id ? getUserDetails(user.id) : Promise.reject("No user ID")),
    enabled: !!user?.id && isDepartmentAdmin,
  })

  // Determine authorized department IDs
  const assignedDepartmentIds = useMemo(() => {
    if (isSuperAdmin) return null // All depts
    
    const deptList = (userDetails as any)?.data?.departments || (userDetails as any)?.departments
    if (Array.isArray(deptList)) {
      return new Set(deptList.map((d: any) => Number(d.id || d.departmentId)))
    }
    
    // Fallback to context
    return new Set((user?.departmentRoles || []).map(dr => Number(dr.departmentId)))
  }, [user, userDetails, isSuperAdmin, isDepartmentAdmin])

  const listParams = useMemo(
    () => {
      // Send all assigned department IDs as a comma-separated string. 
      const filterDeptId = (assignedDepartmentIds && assignedDepartmentIds.size > 0) 
        ? Array.from(assignedDepartmentIds).join(",") 
        : undefined

      return {
        page: pagination.page,
        limit: pagination.pageSize,
        departmentId: filterDeptId,
        search: filters.search.trim() === "" ? undefined : filters.search.trim(),
        // Checked: only inactive. Unchecked: only active (backend expects explicit enum; omitting the param returns all statuses).
        costpoolStatus: filters.inactive
          ? CostPoolStatus.INACTIVE
          : CostPoolStatus.ACTIVE,
      }
    },
    [pagination.page, pagination.pageSize, filters.search, filters.inactive, assignedDepartmentIds],
  )

  const query = useCostPoolListQuery(listParams)

  const listPayload = query.data

  const rows: CostPoolRow[] = useMemo(
    () => (listPayload?.data ?? []).map(listItemToTableRow),
    [listPayload],
  )

  const totalItems = listPayload?.meta.totalItems ?? 0

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    rows,
    totalItems,
    isLoading: query.isPending || query.isFetching || isDetailsLoading,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
    },
    onPageChange,
    onPageSizeChange,
  }
}
