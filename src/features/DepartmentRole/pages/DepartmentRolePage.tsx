import { useState, useCallback } from "react"
import { useDepartmentRoles } from "../hooks/useDepartmentRoles"
import { DepartmenRoleTable } from "../components/DepartmenRoleTable"
import { DepartmentRoleAdd } from "../components/DepartmentRoleAdd"
import { DepartmentRoleView } from "../components/DepartmentRoleView"
import type {
  AddRoleFormValues,
  DepartmentRoleViewData,
  DepartmentRoleWithChildren,
} from "../types"

function getRoleViewData(
  id: string,
  data: DepartmentRoleWithChildren[]
): DepartmentRoleViewData | null {
  for (const row of data) {
    if (row.id === id) {
      return {
        departmentName: row.departmentName,
        roleName: row.roles[0] ?? row.departmentName,
        active: row.status === "active",
      }
    }
    for (const child of row.children ?? []) {
      if (child.id === id) {
        return {
          departmentName: row.departmentName,
          roleName: child.roleName,
          active: child.status === "active",
        }
      }
    }
  }
  return null
}

export function DepartmentRolePage() {
  const [addOpen, setAddOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedViewRole, setSelectedViewRole] =
    useState<DepartmentRoleViewData | null>(null)
  const {
    data,
    isLoading,
    pagination,
    onPageChange,
    onPageSizeChange,
  } = useDepartmentRoles()

  const handleOptionAction = useCallback((_id: string, action: string) => {
    if (action === "add") setAddOpen(true)
    if (action === "delete") {
      // TODO: handle delete
    }
  }, [])

  const handleView = useCallback(
    (id: string) => {
      const roleData = getRoleViewData(id, data)
      setSelectedViewRole(roleData)
      setViewOpen(true)
    },
    [data]
  )

  const handleAddRoleSubmit = useCallback((values: AddRoleFormValues) => {
    // TODO: wire to API when available; values: department, roleName, active, assignedPermissions
    setAddOpen(false)
  }, [])

  return (
    <div className="space-y-6">
     
      <DepartmenRoleTable
        data={data}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        isLoading={isLoading}
        onOptionAction={handleOptionAction}
        onView={handleView}
      />
      <DepartmentRoleAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAddRoleSubmit}
      />
      <DepartmentRoleView
        open={viewOpen}
        onOpenChange={setViewOpen}
        role={selectedViewRole}
      />
    </div>
  )
}
