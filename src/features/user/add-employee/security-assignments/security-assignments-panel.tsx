import { Check } from "lucide-react"
import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { toast } from "sonner"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { queryClient } from "@/main"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

import type {
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeSecurityRoleItem,
  AddEmployeeSecurityRolePanelProps,
  SecurityAssignmentsPanelProps,
  UserModuleFormValues,
} from "../types"

import { addEmployeeTransferSuccessToastOptions } from "../schemas"
import { useAssignUserDepartmentRoles, useUnassignUserDepartmentRoles } from "../mutations/user-department-role-transfer"
import { addEmployeeLookupKeys, departmentRolesUnassignedCacheUserKey } from "../keys"
import { useGetDepartmentRolesUnassigned } from "../queries/get-add-employee"
import {
  buildUserDepartmentRoleDepartmentsPayload,
  departmentIdFromSecurityCatalogItemId,
  roleRefIdFromSecurityCatalogItemId,
} from "../utility/buildUserDepartmentRoleDepartmentsPayload"

function normalizeDeptRolePart(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

/** Match assigned row from user details to catalog row (department + role name). */
function departmentRolePairKey(department: string, roleName: string): string {
  return `${normalizeDeptRolePart(department)}|${normalizeDeptRolePart(roleName)}`
}

/** Extend cached GET /roles-unassigned so unassigned rows reappear without refetching. */
function mergeRowsIntoRolesUnassignedCache(
  queryKey: ReturnType<typeof addEmployeeLookupKeys.departmentRolesUnassignedAdd>,
  rows: Pick<AddEmployeeSecurityRoleCatalogItem, "id" | "name" | "department">[],
) {
  queryClient.setQueryData<AddEmployeeSecurityRoleCatalogItem[]>(queryKey, (prev) => {
    const base = prev ?? []
    const seen = new Set(base.map((r) => r.id))
    const merged = [...base]
    for (const item of rows) {
      if (item.id.startsWith("assigned:")) continue
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push({
        id: item.id,
        name: item.name,
        department: item.department,
      })
    }
    return merged
  })
}

function RoleTransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
}: AddEmployeeSecurityRolePanelProps) {
  const groups = useMemo(() => {
    const map = new Map<string, AddEmployeeSecurityRoleItem[]>()
    for (const item of items) {
      const list = map.get(item.department) ?? []
      list.push(item)
      map.set(item.department, list)
    }
    return Array.from(map.entries()).map(([department, roles]) => ({
      department,
      roles: roles.slice().sort((a, b) => a.name.localeCompare(b.name)),
    }))
  }, [items])

  const allSelected = items.length > 0 && items.every((item) => selectedIds.includes(item.id))

  const toggleDepartment = (department: string) => {
    const deptItems = items.filter((item) => item.department === department)
    if (deptItems.length === 0) return
    const deptIds = deptItems.map((i) => i.id)
    const isAllDeptSelected = deptIds.every((id) => selectedIds.includes(id))
    if (isAllDeptSelected) {
      for (const id of deptIds) {
        if (selectedIds.includes(id)) onToggleItem(id)
      }
      return
    }
    for (const id of deptIds) {
      if (!selectedIds.includes(id)) onToggleItem(id)
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white">
      <div className="flex h-11 items-center justify-between gap-3 bg-[#6C5DD3] px-3 text-[13px] font-medium text-white">
        <span className="flex-1">{title}</span>
        <div className="flex items-center gap-2 text-[11px] font-semibold">
          <span>All</span>
          <button
            type="button"
            onClick={onToggleAll}
            className={`flex size-4.5 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
              allSelected
                ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
            }`}
            aria-label="Toggle all"
          >
            <Check className="size-3.5 stroke-[3]" />
          </button>
          <span className="flex-1">
          <span className="font-bold text-white/90">{items.length}</span>
        </span>
        </div>
      </div>

      <ScrollArea className="h-[330px] py-2 px-2 ">
        {items.length > 0 ? (
          <div className="flex flex-col">
            {groups.map((group) => {
              const deptIds = group.roles.map((r) => r.id)
              const deptAllSelected =
                deptIds.length > 0 && deptIds.every((id) => selectedIds.includes(id))
              return (
                <div key={group.department} className="border-b border-[#f1f3f7] last:border-b-0">
                  <div className="grid h-7 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 bg-[#F3F4F6] pl-4 pr-5 text-[10px] font-semibold text-[#374151]">
                    <span className="min-w-0">{group.department}</span>
                    <button
                      type="button"
                      onClick={() => toggleDepartment(group.department)}
                      className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                        deptAllSelected
                          ? "border-[#6C5DD3] bg-white text-[#6C5DD3]"
                          : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                      }`}
                      aria-label={`Toggle all ${group.department}`}
                    >
                      <Check className="size-3.5 stroke-[3]" />
                    </button>
                  </div>

                  <div className="px-6 py-0.5">
                    <span className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1 text-[10px] font-bold text-[#374151] shadow-sm">
                      Role
                    </span>
                  </div>

                  <div className="flex flex-col pb-2">
                    {group.roles.map((item) => {
                      const isSelected = selectedIds.includes(item.id)
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onToggleItem(item.id)}
                          className={`group relative grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-1 pl-9 pr-5 text-left transition-colors ${
                            isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            {/* Tree connector lines like Program Activity Relation TransferPanel */}
                            <div className="absolute left-6 top-0.5 flex h-full w-8 items-center justify-center">
                              <div className="absolute left-4 top-0 h-full w-px bg-[#E5E7EB]" />
                              <div className="absolute left-4 top-1/2 h-px w-3 bg-[#E5E7EB]" />
                            </div>
                            <div className="pl-6 text-[10px] font-medium text-[#111827] whitespace-normal break-words">
                              {item.name}
                            </div>
                          </div>
                          <div
                            className={`flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border shadow-sm transition-all ${
                              isSelected
                                ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                                : "border-[#E5E7EB] bg-white text-transparent hover:border-[#D1D5DB]"
                            }`}
                          >
                            <Check className="size-3.5 stroke-[3]" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-[280px] flex-col items-center justify-center bg-white">
            <img src={tableEmptyIcon} alt="Empty" className="size-24 object-contain opacity-80" />
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function normalizeRoleId(role: string): string {
  return role.trim().toLowerCase().replace(/\s+/g, "-")
}

/** UI tab: Security / Assignments */
export function SecurityAssignmentsPanel({
  mode,
  securityContextUserId = null,
  allowUnassignedQueryWithoutUserId,
  onAddModeTransferSucceeded,
}: SecurityAssignmentsPanelProps) {
  const unassignedQuery = useGetDepartmentRolesUnassigned(
    securityContextUserId,
    allowUnassignedQueryWithoutUserId,
  )

  const rolesUnassignedQueryKey = addEmployeeLookupKeys.departmentRolesUnassignedAdd(
    departmentRolesUnassignedCacheUserKey(securityContextUserId, allowUnassignedQueryWithoutUserId),
  )

  const securityUserId = securityContextUserId?.trim() ?? ""
  const canPersistTransfers = securityUserId.length > 0
  const assignMutation = useAssignUserDepartmentRoles()
  const unassignMutation = useUnassignUserDepartmentRoles()
  const transferBusy = assignMutation.isPending || unassignMutation.isPending

  const isAddMode = mode === "add"
  const isEditMode = mode === "edit"
  const { watch, control, setValue, getValues } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const assignedRoles = watch("roleAssignments") ?? []
  const securitySnapshots = watch("securityAssignedSnapshots") ?? []

  /**
   * Unassigned API (with `userId` in edit) returns server “still unassigned” rows; we also remove anything
   * already shown as assigned from user details (`securityAssignedSnapshots`: dept + role + catalog id).
   */
  const unassignedItems = useMemo(() => {
    if (!unassignedQuery.isSuccess || !unassignedQuery.data) return []
    const data = unassignedQuery.data
    const snapIds = new Set(securitySnapshots.map((s) => s.id))
    const assignedPairKeys = new Set(
      securitySnapshots.map((s) => departmentRolePairKey(s.department, s.name)),
    )

    const isAlreadyAssignedInDetails = (i: AddEmployeeSecurityRoleCatalogItem) => {
      if (snapIds.has(i.id)) return true
      if (
        assignedPairKeys.size > 0 &&
        assignedPairKeys.has(departmentRolePairKey(i.department, i.name))
      ) {
        return true
      }
      return false
    }

    if (isAddMode) {
      return data.filter((i) => !isAlreadyAssignedInDetails(i))
    }
    if (isEditMode && securitySnapshots.length > 0) {
      return data.filter((i) => !isAlreadyAssignedInDetails(i))
    }
    return data.filter((i) => !assignedRoles.includes(i.name))
  }, [
    unassignedQuery.data,
    unassignedQuery.isSuccess,
    assignedRoles,
    isAddMode,
    isEditMode,
    securitySnapshots,
  ])

  /**
   * Assigned column: snapshots carry real department names (add wizard + edit after details merge).
   * Fallback label "Assigned" only when we have role names but no dept–role pairs yet.
   */
  const assignedItems = useMemo((): AddEmployeeSecurityRoleItem[] => {
    if (securitySnapshots.length > 0) {
      return securitySnapshots.map((s) => ({
        id: s.id,
        name: s.name,
        department: s.department,
      }))
    }
    const out: AddEmployeeSecurityRoleItem[] = []
    const seen = new Set<string>()
    for (const name of assignedRoles) {
      const n = name.trim()
      if (!n || seen.has(n)) continue
      seen.add(n)
      out.push({
        id: `assigned:${normalizeRoleId(n)}`,
        name: n,
        department: "Assigned",
      })
    }
    return out
  }, [securitySnapshots, assignedRoles])

  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const toggle = (id: string, isAssigned: boolean) => {
    if (isAssigned) {
      setToggledA((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
      return
    }
    setToggledU((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAllUnassigned = () => {
    setToggledU((prev) =>
      prev.length === unassignedItems.length ? [] : unassignedItems.map((i) => i.id),
    )
  }

  const toggleAllAssigned = () => {
    setToggledA((prev) =>
      prev.length === assignedItems.length ? [] : assignedItems.map((i) => i.id),
    )
  }

  const transferToAssigned = async () => {
    if (toggledU.length === 0) return
    const catalog = unassignedQuery.data ?? []
    const toAdd = catalog.filter((i) => toggledU.includes(i.id))
    if (toAdd.length === 0) {
      setToggledU([])
      return
    }

    const departments = buildUserDepartmentRoleDepartmentsPayload(toAdd)
    if (departments.length === 0) {
      toast.error("Could not assign: invalid role selection.")
      return
    }

    if (canPersistTransfers) {
      try {
        await assignMutation.mutateAsync({ userId: securityUserId, departments })
        toast.success("Roles assigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Assign failed")
        return
      }
    }

    const prev = getValues("securityAssignedSnapshots") ?? []
    const nextSnaps = [...prev]
    for (const i of toAdd) {
      if (nextSnaps.some((s) => s.id === i.id)) continue
      const departmentId = departmentIdFromSecurityCatalogItemId(i.id)
      if (departmentId == null) continue
      nextSnaps.push({
        id: i.id,
        name: i.name,
        departmentId,
        department: i.department,
      })
    }
    setValue("securityAssignedSnapshots", nextSnaps, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setValue(
      "roleAssignments",
      [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    )
    setToggledU([])
    if (isAddMode) {
      onAddModeTransferSucceeded?.()
    }
  }

  const transferToUnassigned = async () => {
    if (toggledA.length === 0) return
    const toRemoveItems = assignedItems.filter((i) => toggledA.includes(i.id))
    if (toRemoveItems.length === 0) {
      setToggledA([])
      return
    }

    if (canPersistTransfers) {
      const invalid = toRemoveItems.some(
        (i) =>
          i.id.startsWith("assigned:") ||
          departmentIdFromSecurityCatalogItemId(i.id) == null ||
          roleRefIdFromSecurityCatalogItemId(i.id) == null,
      )
      if (invalid) {
        toast.error("Some assignments cannot be updated on the server. Reload this user and try again.")
        return
      }
      const departments = buildUserDepartmentRoleDepartmentsPayload(toRemoveItems)
      if (departments.length === 0) {
        toast.error("Could not unassign: invalid role selection.")
        return
      }
      try {
        await unassignMutation.mutateAsync({ userId: securityUserId, departments })
        mergeRowsIntoRolesUnassignedCache(rolesUnassignedQueryKey, toRemoveItems)
        toast.success("Roles unassigned.", addEmployeeTransferSuccessToastOptions)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Unassign failed")
        return
      }
    }

    if (isAddMode) {
      const removeIds = new Set(toRemoveItems.map((i) => i.id))
      const prev = getValues("securityAssignedSnapshots") ?? []
      const nextSnaps = prev.filter((s) => !removeIds.has(s.id))
      setValue("securityAssignedSnapshots", nextSnaps, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue(
        "roleAssignments",
        [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
      )
      setToggledA([])
      onAddModeTransferSucceeded?.()
      return
    }
    const prevSnaps = getValues("securityAssignedSnapshots") ?? []
    if (prevSnaps.length > 0) {
      const removeIds = new Set(toRemoveItems.map((i) => i.id))
      const nextSnaps = prevSnaps.filter((s) => !removeIds.has(s.id))
      setValue("securityAssignedSnapshots", nextSnaps, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
      setValue(
        "roleAssignments",
        [...new Set(nextSnaps.map((s) => s.name.trim()).filter(Boolean))],
        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
      )
    } else {
      const namesToRemove = toRemoveItems.map((i) => i.name)
      const next = assignedRoles.filter((r) => !namesToRemove.includes(r))
      setValue("roleAssignments", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    }
    setToggledA([])
  }

  return (
    <div className="pt-1">
      <div className="mb-3 flex items-start justify-between">
        <p className="select-none text-[12px] font-semibold uppercase text-[#111827]">{employeeName}</p>

        <div className="flex items-center gap-5 pr-1 pt-1">
          <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#111827]">
            <Controller
              name="supervisorApportioning"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                />
              )}
            />
            Supervisor Apportioning
          </label>

          <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#111827]">
            <Controller
              name="clientAdmin"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="size-3.5 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
                />
              )}
            />
            Client Admin
          </label>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <RoleTransferPanel
          title="Select Department(Unassigned)"
          items={unassignedItems}
          selectedIds={toggledU}
          onToggleItem={(id) => toggle(id, false)}
          onToggleAll={toggleAllUnassigned}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            onClick={() => void transferToAssigned()}
            disabled={toggledU.length === 0 || transferBusy}
            aria-label="Move selected to assigned"
          />
          <TransferListMoveButton
            direction="back"
            onClick={() => void transferToUnassigned()}
            disabled={toggledA.length === 0 || transferBusy}
            aria-label="Move selected to unassigned"
          />
        </div>

        <RoleTransferPanel
          title="Select Department(Assigned)"
          items={assignedItems}
          selectedIds={toggledA}
          onToggleItem={(id) => toggle(id, true)}
          onToggleAll={toggleAllAssigned}
        />
      </div>
    </div>
  )
}
