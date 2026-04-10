import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { Check } from "lucide-react"

import { useDepartmentRoles } from "../hooks/useDepartmentRoles"
import { DepartmenRoleTable } from "../components/DepartmenRoleTable"
import { DepartmentRoleAdd } from "../components/DepartmentRoleAdd"
import { DepartmentRoleView } from "../components/DepartmentRoleView"
import { permissionLabelsToApiPermissionIds } from "../api/departmentRoleCreatePermissions"
import { useCreateDepartmentRole } from "../mutations/createDepartmentRole"
import { useAssignDepartmentRolePermissions } from "../mutations/assignDepartmentRolePermissions"
import { useUnassignDepartmentRolePermissions } from "../mutations/unassignDepartmentRolePermissions"
import { useUpdateDepartmentRoleChildStatus } from "../mutations/updateDepartmentRoleChildStatus"
import { useGetDepartments } from "@/features/department/queries/getDepartments"

import { useDepartmentRoleDetailQuery } from "../queries/getDepartmentRoleById"
import type {
  AddRoleFormValues,
  DepartmentRoleDetail,
  DepartmentRoleViewData,
} from "../types"

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
  const [addDepartmentId, setAddDepartmentId] = useState<number | undefined>(
    undefined
  )
  const [editRoleId, setEditRoleId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<"create" | "edit">("create")
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRoleId, setViewRoleId] = useState<string | null>(null)

  const {
    data,
    isLoading,
    pagination,
    listFilters,
    onPageChange,
    onPageSizeChange,
  } = useDepartmentRoles()

  const viewDetailQuery = useDepartmentRoleDetailQuery(viewRoleId, {
    enabled: viewOpen && Boolean(viewRoleId),
  })

  const editDetailQuery = useDepartmentRoleDetailQuery(editRoleId, {
    enabled: addOpen && addMode === "edit" && Boolean(editRoleId),
  })

  /** Load while on this page so edit dialog has names before first open (avoids empty department Select). */
  const activeDepartmentsQuery = useGetDepartments({ status: "active", page: 1, limit: 100 }, { enabled: true })

  const viewRole: DepartmentRoleViewData | null = useMemo(() => {
    if (!viewDetailQuery.data) return null
    const d = viewDetailQuery.data
    return {
      departmentName: d.departmentName,
      roleName: d.roleName,
      active: d.active,
      assignedPermissions: d.assignedPermissions,
      permissionGroups: d.permissionGroups,
    }
  }, [viewDetailQuery.data])

  const editDetailError = useMemo(() => {
    if (addMode !== "edit" || !editRoleId) return null
    return editDetailQuery.error instanceof Error
      ? editDetailQuery.error
      : editDetailQuery.error != null
        ? new Error(String(editDetailQuery.error))
        : null
  }, [addMode, editRoleId, editDetailQuery.error])

  /**
   * Keep edit dialog on spinner until we can build stable `editFormValues` (react-hook-form `values`).
   * First open often had role detail before `GET /departments` finished, so `departmentName` stayed ""
   * and the Select never matched an option; reopen worked because the catalog was cached.
   */
  const isEditDetailLoading = useMemo(() => {
    if (addMode !== "edit" || !editRoleId) return false
    if (!editDetailQuery.data) {
      return editDetailQuery.isPending || editDetailQuery.isFetching
    }
    const d = editDetailQuery.data
    if (d.departmentName?.trim()) return false
    if (d.departmentId == null) return false
    const row = data.find(
      (r) =>
        r.departmentId === d.departmentId || Number(r.id) === d.departmentId
    )
    if (row?.departmentName?.trim()) return false
    return (
      activeDepartmentsQuery.isPending || activeDepartmentsQuery.isFetching
    )
  }, [
    activeDepartmentsQuery.isFetching,
    activeDepartmentsQuery.isPending,
    addMode,
    data,
    editRoleId,
    editDetailQuery.data,
    editDetailQuery.isPending,
    editDetailQuery.isFetching,
  ])

  /**
   * When GET omits nested `department.name`, resolve from the department-role table row, then from
   * `GET /departments` so pagination does not hide the label.
   */
  const editDetailResolved = useMemo((): DepartmentRoleDetail | null => {
    const d = editDetailQuery.data
    if (!d) return null
    const name = d.departmentName?.trim() ?? ""
    if (name) return d
    if (d.departmentId == null) return d
    const row = data.find(
      (r) =>
        r.departmentId === d.departmentId || Number(r.id) === d.departmentId
    )
    const fromTable = row?.departmentName?.trim() ?? ""
    if (fromTable) return { ...d, departmentName: fromTable }
    const fromCatalog = activeDepartmentsQuery.data?.items?.find(
      (x) =>
        Number(x.id) === d.departmentId ||
        String(x.id) === String(d.departmentId)
    )
    const fromApi = fromCatalog?.name?.trim() ?? ""
    if (fromApi) return { ...d, departmentName: fromApi }
    return d
  }, [activeDepartmentsQuery.data, data, editDetailQuery.data])

  const departmentSelectOptions = useMemo(() => {
    const fromTable = data
      .map((r) => r.departmentName)
      .filter((n): n is string => Boolean(n?.trim()))
    const fromApi = (activeDepartmentsQuery.data?.items ?? [])
      .map((x) => x.name)
      .filter((n): n is string => Boolean(n?.trim()))
    return [...new Set([...fromTable, ...fromApi])].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )
  }, [activeDepartmentsQuery.data, data])

  const createRole = useCreateDepartmentRole()
  const updateChildStatus = useUpdateDepartmentRoleChildStatus()
  const assignPerms = useAssignDepartmentRolePermissions()
  const unassignPerms = useUnassignDepartmentRolePermissions()

  const handleViewOpenChange = useCallback((open: boolean) => {
    setViewOpen(open)
    if (!open) setViewRoleId(null)
  }, [])

  const handleOptionAction = useCallback(
    (id: string, action: string) => {
      if (action === "add") {
        const row = data.find((d) => d.id === id)
        setAddDepartment(row?.departmentName)
        const deptId = row?.departmentId ?? Number(row?.id)
        setAddDepartmentId(Number.isFinite(deptId) ? deptId : undefined)
        setEditRoleId(null)
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

  const handleView = useCallback((id: string) => {
    setViewRoleId(id)
    setViewOpen(true)
  }, [])

  const handleEdit = useCallback((childId: string) => {
    setEditRoleId(childId)
    setAddDepartment(undefined)
    setAddDepartmentId(undefined)
    setAddMode("edit")
    setAddDialogKey((k) => k + 1)
    setAddOpen(true)
  }, [])

  const handleToggleChildStatus = useCallback(
    (childId: string, active: boolean) => {
      updateChildStatus.mutate({
        childId,
        status: active ? "active" : "inactive",
        listFilters,
      })
    },
    [listFilters, updateChildStatus]
  )

  const departments = departmentSelectOptions

  const resolveDepartmentId = useCallback(
    (departmentName: string, fallbackId?: number) => {
      if (fallbackId != null && Number.isFinite(fallbackId)) return fallbackId
      const row = data.find((d) => d.departmentName === departmentName)
      if (row) {
        const id = row.departmentId ?? Number(row.id)
        if (Number.isFinite(id)) return id
      }
      const fromCatalog = activeDepartmentsQuery.data?.items?.find(
        (d) =>
          d.name === departmentName ||
          d.name.trim().toLowerCase() === departmentName.trim().toLowerCase()
      )
      if (fromCatalog) {
        const id = Number(fromCatalog.id)
        if (Number.isFinite(id)) return id
      }
      return NaN
    },
    [activeDepartmentsQuery.data, data]
  )

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

      const departmentId = resolveDepartmentId(values.department, addDepartmentId)
      if (!Number.isFinite(departmentId)) {
        toast.error("Could not resolve department for this role.")
        return
      }

      createRole.mutate(
        {
          ...values,
          departmentId,
          listFilters,
        },
        {
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
            createRole.reset()
          },
        }
      )
    },
    [
      addDepartmentId,
      createRole,
      data,
      listFilters,
      resolveDepartmentId,
      successToastOptions,
    ]
  )

  const handleEditAssignLabels = useCallback(
    async (labels: string[]) => {
      if (!editRoleId) return
      const catalog = editDetailQuery.data?.permissionCatalogByModuleName
      const ids = permissionLabelsToApiPermissionIds(labels, catalog)
      if (ids.length === 0) return
      await assignPerms.mutateAsync({
        departmentRoleId: Number(editRoleId),
        permissions: ids,
        listFilters,
        detailId: editRoleId,
      })
    },
    [assignPerms, editDetailQuery.data, editRoleId, listFilters]
  )

  const handleEditUnassignLabels = useCallback(
    async (labels: string[]) => {
      if (!editRoleId) return
      const catalog = editDetailQuery.data?.permissionCatalogByModuleName
      const ids = permissionLabelsToApiPermissionIds(labels, catalog)
      if (ids.length === 0) return
      await unassignPerms.mutateAsync({
        departmentRoleId: Number(editRoleId),
        permissions: ids,
        listFilters,
        detailId: editRoleId,
      })
    },
    [editDetailQuery.data, editRoleId, listFilters, unassignPerms]
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
            setEditRoleId(null)
            setAddMode("create")
            setAddDepartmentId(undefined)
          }
        }}
        departments={departments.length ? departments : ["Social Services"]}
        initialDepartment={addDepartment}
        mode={addMode}
        editRoleId={editRoleId}
        editDetail={editDetailResolved}
        isEditDetailLoading={isEditDetailLoading}
        editDetailError={editDetailError}
        onSubmit={(values) => {
          if ("childId" in values) return
          handleAddRoleSubmit(values)
        }}
        onEditAssignPermissionLabels={
          addMode === "edit" ? handleEditAssignLabels : undefined
        }
        onEditUnassignPermissionLabels={
          addMode === "edit" ? handleEditUnassignLabels : undefined
        }
        isEditPermissionTransferPending={
          assignPerms.isPending || unassignPerms.isPending
        }
        isSubmitting={addMode === "create" && createRole.isPending}
      />
      <DepartmentRoleView
        open={viewOpen}
        onOpenChange={handleViewOpenChange}
        role={viewRole}
        isLoading={
          viewOpen &&
          (viewDetailQuery.isPending || viewDetailQuery.isFetching) &&
          Boolean(viewRoleId)
        }
      />
    </div>
  )
}
