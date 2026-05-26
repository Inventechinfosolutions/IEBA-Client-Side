import { useMemo, useState } from "react"

import { usePermissions } from "@/hooks/usePermissions"

import { CountyActivityCodeTable } from "../components/CountyActivityCodeTable"
import { useCountyActivityCodes } from "../hooks/useCountyActivityCodes"
import { countyActivityFilterDefaultValues } from "../schemas"
import type { CountyActivityFilterFormValues } from "../types"

const DEFAULT_FILTERS: CountyActivityFilterFormValues = countyActivityFilterDefaultValues

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

  const {
    rows,
    primaryRows,
    totalItems,
    pagination,
    onPageChange,
    onPageSizeChange,
    isLoading,
  } = useCountyActivityCodes(filters, assignedDepartmentIds)

  return (
    <div className="space-y-4">
      <CountyActivityCodeTable
        rows={rows}
        primaryRows={primaryRows}
        totalItems={totalItems}
        pagination={pagination}
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

export default CountyActivityCodePage

