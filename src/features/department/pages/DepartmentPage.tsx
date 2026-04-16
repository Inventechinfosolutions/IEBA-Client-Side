import { useState } from "react"
import { DepartmentTable } from "../components/DepartmentTable"
import { DepartmentAddPage } from "../components/DepartmentAddModal"
import { useDepartments } from "../hooks/useDepartments"
import { usePermissions } from "@/hooks/usePermissions"
import type { DepartmentFilter } from "../types"

const DEFAULT_FILTERS: DepartmentFilter = {
  search: "",
  inactive: false,
}

export function DepartmentPage() {
  const { isSuperAdmin, user } = usePermissions()
  const [filters, setFilters] = useState<DepartmentFilter>(DEFAULT_FILTERS)
  
  // Super Admin sees all; others see only their assigned departments.
  const userIdFilter = isSuperAdmin ? undefined : user?.id

  const {
    departments,
    totalItems,
    isLoading,
    pagination,
    onPageChange,
    onPageSizeChange,
  } = useDepartments(filters, userIdFilter)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleEdit = (id: string) => {
    // Detail is loaded once inside `useGetDepartmentById` — avoid a duplicate prefetch GET.
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
