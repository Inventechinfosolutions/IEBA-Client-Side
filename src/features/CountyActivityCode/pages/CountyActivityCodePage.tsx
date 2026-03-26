import { useState } from "react"

import { CountyActivityCodeTable } from "../components/CountyActivityCodeTable"
import { useCountyActivityCodes } from "../hooks/useCountyActivityCodes"
import { countyActivityFilterDefaultValues } from "../schemas"
import type { CountyActivityFilterFormValues } from "../types"

const DEFAULT_FILTERS: CountyActivityFilterFormValues = countyActivityFilterDefaultValues

export function CountyActivityCodePage() {
  const [filters, setFilters] = useState<CountyActivityFilterFormValues>(
    DEFAULT_FILTERS
  )
  const {
    rows,
    primaryRows,
    subRowsByParentId,
    totalItems,
    pagination,
    onPageChange,
    onPageSizeChange,
    isLoading,
  } = useCountyActivityCodes(filters)

  return (
    <div className="space-y-4">
      <CountyActivityCodeTable
        rows={rows}
        primaryRows={primaryRows}
        subRowsByParentId={subRowsByParentId}
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
