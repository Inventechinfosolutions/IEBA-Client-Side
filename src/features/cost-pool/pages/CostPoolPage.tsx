import { useState } from "react"

import { CostPoolTable } from "../components/CostPoolTable"
import { useCostPools } from "../hooks/useCostPools"
import { costPoolFilterDefaultValues } from "../schemas"
import type { CostPoolFilterFormValues } from "../types"

const DEFAULT_FILTERS: CostPoolFilterFormValues = costPoolFilterDefaultValues

export function CostPoolPage() {
  const [filters, setFilters] = useState<CostPoolFilterFormValues>(DEFAULT_FILTERS)
  const { rows, totalItems, pagination, onPageChange, onPageSizeChange, isLoading } =
    useCostPools(filters)

  return (
    <div className="space-y-4">
      <CostPoolTable
        rows={rows}
        totalItems={totalItems}
        pagination={pagination}
        isLoading={isLoading}
        filters={filters}
        onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
        onInactiveChange={(inactive) => setFilters((prev) => ({ ...prev, inactive }))}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}

