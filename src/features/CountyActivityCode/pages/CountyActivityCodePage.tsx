import { useMemo, useState } from "react"

import { useGetDepartments } from "@/features/department/queries/getDepartments"
import { usePermissions } from "@/hooks/usePermissions"
import type { Department } from "@/features/department/types"

import { CountyActivityCodeTable } from "../components/CountyActivityCodeTable"
import { useCountyActivityCodes } from "../hooks/useCountyActivityCodes"
import { countyActivityFilterDefaultValues } from "../schemas"
import type { CountyActivityFilterFormValues } from "../types"

const DEFAULT_FILTERS: CountyActivityFilterFormValues = countyActivityFilterDefaultValues

const NO_DEPARTMENTS: Department[] = []

export function CountyActivityCodePage() {
  const [filters, setFilters] = useState<CountyActivityFilterFormValues>(
    DEFAULT_FILTERS
  )

  const { isSuperAdmin, user } = usePermissions()

  // Build the set of department IDs the logged-in user is assigned to.
  // SuperAdmin → undefined (no filter, sees all).
  // All other roles → only their assigned department IDs.
  const assignedDepartmentIds = useMemo<Set<number> | undefined>(() => {
    if (isSuperAdmin) return undefined
    const ids = new Set<number>()
    user?.departmentRoles?.forEach(dr => {
      if (dr.departmentId) ids.add(dr.departmentId)
    })
    return ids
  }, [isSuperAdmin, user])

  const departmentsQuery = useGetDepartments({ status: "active", page: 1, limit: 1000 })
  const departments = departmentsQuery.data?.items ?? NO_DEPARTMENTS
  const {
    rows,
    primaryRows,
    activePrimaryCountyRows,
    subCountyParentPickerRows,
    subRowsByParentId,
    totalItems,
    pagination,
    onPageChange,
    onPageSizeChange,
    isLoading,
  } = useCountyActivityCodes(filters, departments, assignedDepartmentIds)

  return (
    <div className="space-y-4">
      <CountyActivityCodeTable
        rows={rows}
        primaryRows={primaryRows}
        activePrimaryCountyRows={activePrimaryCountyRows}
        subCountyParentPickerRows={subCountyParentPickerRows}
        subRowsByParentId={subRowsByParentId}
        totalItems={totalItems}
        pagination={pagination}
        departments={departments}
        isLoading={isLoading}
        filters={filters}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onInactiveChange={(inactive) =>
          setFilters((prev) => ({ ...prev, inactive }))
        }
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
