import { useState } from "react"

import { useGetDepartments } from "@/features/department/queries/getDepartments"
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
  const departmentsQuery = useGetDepartments("active")
  const departments = departmentsQuery.data ?? NO_DEPARTMENTS
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
  } = useCountyActivityCodes(filters, departments)

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
