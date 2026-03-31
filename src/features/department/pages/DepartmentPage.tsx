import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { DepartmentTable } from "../components/DepartmentTable"
import { DepartmentAddPage } from "../components/DepartmentAddPage"
import { useDepartments } from "../hooks/useDepartments"
import { departmentKeys } from "../keys"
import { loadDepartmentDetailForModal } from "../queries/getDepartmentById"
import type { DepartmentFilter } from "../types"

const DEFAULT_FILTERS: DepartmentFilter = {
  search: "",
  inactive: false,
}

export function DepartmentPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<DepartmentFilter>(DEFAULT_FILTERS)
  const {
    departments,
    totalItems,
    isLoading,
    pagination,
    onPageChange,
    onPageSizeChange,
  } = useDepartments(filters)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    void queryClient.prefetchQuery({
      queryKey: departmentKeys.detail(id),
      queryFn: () => loadDepartmentDetailForModal(queryClient, id),
    })
    setEditingId(id)
    setIsAddModalOpen(true)
  }

  const handleClose = () => {
    setIsAddModalOpen(false)
    setEditingId(null)
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="w-full rounded-[10px] bg-white p-4 sm:p-6 shadow-sm border border-[#E5E7EB]">
        <DepartmentTable
          departments={departments}
          totalItems={totalItems}
          isLoading={isLoading}
          pagination={{
            pageIndex: pagination.page,
            pageSize: pagination.pageSize,
          }}
          filters={filters}
          onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
          onInactiveChange={(inactive) =>
            setFilters((prev) => ({ ...prev, inactive }))
          }
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onAdd={() => setIsAddModalOpen(true)}
          onEdit={handleEdit}
        />
      </div>

      {isAddModalOpen && (
        <DepartmentAddPage
          id={editingId}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
