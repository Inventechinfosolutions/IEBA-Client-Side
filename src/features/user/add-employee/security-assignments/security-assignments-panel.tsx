import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { toast } from "sonner"

import { queryClient } from "@/main"
import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import { Checkbox } from "@/components/ui/checkbox"
import { usePermissions } from "@/hooks/usePermissions"

import type {
  AddEmployeeSecurityRoleCatalogItem,
  AddEmployeeSecurityRoleItem,
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
import { RoleTransferPanel } from "./role-transfer-panel"

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
  const assignedRoles = watch("roleAssignments") ?? []
  const securitySnapshots = watch("securityAssignedSnapshots") ?? []
  
  const { isSuperAdmin, user } = usePermissions()
  // All non-super-admin roles are restricted to their assigned departments only
  const isRestrictedNonSuperAdmin = !isSuperAdmin

  const allowedDepartmentNames = useMemo(() => {
    if (!isRestrictedNonSuperAdmin || !user?.departmentRoles) return null
    return new Set(user.departmentRoles.map(dr => dr.departmentName))
  }, [isRestrictedNonSuperAdmin, user?.departmentRoles])

  /**
   * Unassigned API (with `userId` in edit) returns server “still unassigned” rows; we also remove anything
   * already shown as assigned from user details (`securityAssignedSnapshots`: dept + role + catalog id).
   */
  const unassignedItems = useMemo(() => {
    if (!unassignedQuery.isSuccess || !unassignedQuery.data) return []
    let data = unassignedQuery.data

    if (isRestrictedNonSuperAdmin && allowedDepartmentNames) {
      data = data.filter(i => allowedDepartmentNames.has(i.department))
    }

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
    isRestrictedNonSuperAdmin,
    allowedDepartmentNames,
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
    const list = isAssigned ? assignedItems : unassignedItems
    const toggled = isAssigned ? toggledA : toggledU
    const setToggled = isAssigned ? setToggledA : setToggledU

    const item = list.find((i) => i.id === id)
    if (!item) return
    const isSelecting = !toggled.includes(id)
    const roleName = item.name.trim()

    // 1. Department Admin selects everything in dept except Payroll Admin
    if (roleName === "Department Admin") {
      const peerIds = list
        .filter((i) => i.department === item.department && i.name.trim() !== "Payroll Admin")
        .map((i) => i.id)

      if (isSelecting) {
        setToggled((prev) => [...new Set([...prev, ...peerIds, id])])
      } else {
        setToggled((prev) => prev.filter((x) => x !== id && !peerIds.includes(x)))
      }
      return
    }

    // 2. Time Study Admin selects Time Study Supervisor and User
    if (roleName === "Time Study Admin") {
      const targets = ["Time Study Supervisor", "User"]
      const peerIds = list
        .filter((i) => i.department === item.department && targets.includes(i.name.trim()))
        .map((i) => i.id)

      if (isSelecting) {
        setToggled((prev) => [...new Set([...prev, ...peerIds, id])])
      } else {
        setToggled((prev) => prev.filter((x) => x !== id && !peerIds.includes(x)))
      }
      return
    }

    // Default toggle
    setToggled((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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

  // Atomic dept-level toggle — selects/deselects all roles in one department at once
  const toggleDepartmentGroupU = (idsToAdd: string[], idsToRemove: string[]) => {
    setToggledU((prev) => {
      const next = new Set(prev)
      idsToRemove.forEach((id) => next.delete(id))
      idsToAdd.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const toggleDepartmentGroupA = (idsToAdd: string[], idsToRemove: string[]) => {
    setToggledA((prev) => {
      const next = new Set(prev)
      idsToRemove.forEach((id) => next.delete(id))
      idsToAdd.forEach((id) => next.add(id))
      return Array.from(next)
    })
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

  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim()

  return (
    <div className="pt-1">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {isAddMode ? (
            <>
              <label className="flex cursor-not-allowed items-center gap-2 text-[11px] select-none text-[#9ca3af]">
                <Controller
                  name="copyUser"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      disabled
                      className="size-4 rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:opacity-100"
                    />
                  )}
                />
                Copy User
              </label>

              <input
                type="text"
                readOnly
                disabled
                className="h-10 w-[280px] rounded-[10px] border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-[11px] outline-none transition-colors cursor-not-allowed text-[#9ca3af]"
              />
            </>
          ) : (
            <p className="text-[12px] font-semibold uppercase text-[#111827]">
              {fullName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-5 pr-1 pt-2">
          <label className="flex cursor-not-allowed items-center gap-2 text-[11px] select-none text-[#9ca3af]">
            <Controller
              name="supervisorApportioning"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled
                  className="size-4 rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary) disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:border-[#e5e7eb] disabled:opacity-100"
                />
              )}
            />
            Supervisor Apportioning
          </label>

          {isSuperAdmin && (
            <label className="flex cursor-pointer select-none items-center gap-2 text-[11px] text-[#111827]">
              <Controller
                name="clientAdmin"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    className="size-4 cursor-pointer rounded-[3px] border-[#c2c6d1] data-[state=checked]:border-(--primary) data-[state=checked]:bg-(--primary)"
                  />
                )}
              />
              Client Admin
            </label>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_60px_1fr] items-center gap-4">
        <RoleTransferPanel
          title="Select Department(Unassigned)"
          items={unassignedItems}
          selectedIds={toggledU}
          onToggleItem={(id) => toggle(id, false)}
          onToggleAll={toggleAllUnassigned}
          onToggleDepartmentGroup={toggleDepartmentGroupU}
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
          onToggleDepartmentGroup={toggleDepartmentGroupA}
        />
      </div>
    </div>
  )
}
