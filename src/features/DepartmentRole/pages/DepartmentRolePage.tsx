import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { useDepartmentRoles } from "../hooks/useDepartmentRoles"
import { DepartmenRoleTable } from "../components/DepartmenRoleTable"
import { DepartmentRoleAdd } from "../components/DepartmentRoleAdd"
import { DepartmentRoleView } from "../components/DepartmentRoleView"
import { useCreateDepartmentRole } from "../mutations/createDepartmentRole"
import { useUpdateDepartmentRoleChildStatus } from "../mutations/updateDepartmentRoleChildStatus"
import { useUpdateDepartmentRoleChild } from "../mutations/updateDepartmentRoleChild"
import type {
  AddRoleFormValues,
  DepartmentRoleViewData,
  DepartmentRoleWithChildren,
  DepartmentRoleEditInitialValues,
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
  const successToastOptions = {
    position: "top-center" as const,
    icon: (
      <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white">
        <Check className="size-3 stroke-[3]" />
      </span>
    ),
    className:
      "!w-fit !max-w-none !min-h-[35px] !rounded-[8px] !border-0 !px-3 !py-2 !text-[11px] !whitespace-nowrap !shadow-[0_8px_22px_rgba(17,24,39,0.18)]",
  }

  const [addOpen, setAddOpen] = useState(false)
  const [addDialogKey, setAddDialogKey] = useState(0)
  const [addDepartment, setAddDepartment] = useState<string | undefined>(
    undefined
  )
  const [editInitialValues, setEditInitialValues] =
    useState<DepartmentRoleEditInitialValues | null>(null)
  const [addMode, setAddMode] = useState<"create" | "edit">("create")
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
  const createRole = useCreateDepartmentRole()
  const updateChildStatus = useUpdateDepartmentRoleChildStatus()
  const updateChild = useUpdateDepartmentRoleChild()

  const handleOptionAction = useCallback(
    (id: string, action: string) => {
      if (action === "add") {
        const dept = data.find((d) => d.id === id)?.departmentName
        setAddDepartment(dept)
        setEditInitialValues(null)
        setAddMode("create")
        setAddDialogKey((k) => k + 1)
        setAddOpen(true)
      }
    if (action === "delete") {
      // TODO: handle delete
    }
    },
    [data]
  )

  const handleView = useCallback(
    (id: string) => {
      const roleData = getRoleViewData(id, data)
      setSelectedViewRole(roleData)
      setViewOpen(true)
    },
    [data]
  )

  const handleEdit = useCallback(
    (childId: string) => {
      for (const dept of data) {
        const child = (dept.children ?? []).find((c) => c.id === childId)
        if (!child) continue
        setEditInitialValues({
          childId,
          departmentName: dept.departmentName,
          roleName: child.roleName,
          active: child.status === "active",
        })
        setAddDepartment(undefined)
        setAddMode("edit")
        setAddDialogKey((k) => k + 1)
        setAddOpen(true)
        return
      }
    },
    [data]
  )

  const handleToggleChildStatus = useCallback(
    (childId: string, active: boolean) => {
      updateChildStatus.mutate({ childId, status: active ? "active" : "inactive" })
    },
    [updateChildStatus]
  )

  const departments = Array.from(new Set(data.map((d) => d.departmentName)))

  const handleAddRoleSubmit = useCallback(
    (values: AddRoleFormValues) => {
      const dept = data.find((d) => d.departmentName === values.department)
      const alreadyExists =
        dept?.roles.some(
          (r) => r.trim().toLowerCase() === values.roleName.trim().toLowerCase()
        ) ?? false

      if (alreadyExists) {
        toast.info("Role already exists")
        return
      }

      createRole.mutate(values, {
        onSuccess: () => {
          toast.success("New Role created Successfully", successToastOptions)
          setAddOpen(false)
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "Failed to create role"
          )
        },
        onSettled: () => {
          // Ensures the list query re-renders even if it was in a paused state.
          createRole.reset()
        },
      })
    },
    [createRole, data, successToastOptions]
  )

  const handleEditRoleSubmit = useCallback(
    (values: { childId: string; roleName: string; active: boolean }) => {
      // Prevent duplicates in the same department
      const dept = data.find((d) =>
        (d.children ?? []).some((c) => c.id === values.childId)
      )
      const alreadyExists =
        dept?.children?.some(
          (c) =>
            c.id !== values.childId &&
            c.roleName.trim().toLowerCase() === values.roleName.trim().toLowerCase()
        ) ?? false

      if (alreadyExists) {
        toast.info("Role already exists")
        return
      }

      updateChild.mutate(
        {
          childId: values.childId,
          roleName: values.roleName,
          status: values.active ? "active" : "inactive",
        },
        {
          onSuccess: () => {
            toast.success("Role updated Successfully", successToastOptions)
            setAddOpen(false)
          },
          onError: (error) => {
            toast.error(
              error instanceof Error ? error.message : "Failed to update role"
            )
          },
        }
      )
    },
    [data, successToastOptions, updateChild]
  )

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
        onEdit={handleEdit}
        onToggleChildStatus={handleToggleChildStatus}
      />
      <DepartmentRoleAdd
        key={addDialogKey}
        open={addOpen}
        onOpenChange={(next) => {
          setAddOpen(next)
          if (!next) {
            setEditInitialValues(null)
            setAddMode("create")
          }
        }}
        departments={departments.length ? departments : ["Social Services"]}
        initialDepartment={addDepartment}
        mode={addMode}
        editInitialValues={editInitialValues}
        onSubmit={(values) => {
          if ("childId" in values) {
            handleEditRoleSubmit(values)
            return
          }
          handleAddRoleSubmit(values)
        }}
        isSubmitting={addMode === "edit" ? updateChild.isPending : createRole.isPending}
      />
      <DepartmentRoleView
        open={viewOpen}
        onOpenChange={setViewOpen}
        role={selectedViewRole}
      />
    </div>
  )
}
