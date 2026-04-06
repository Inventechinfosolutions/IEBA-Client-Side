import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { AddEmployeeSecurityRoleItem, AddEmployeeSecurityRolePanelProps, UserModuleFormValues } from "../types"

import { useGetDepartmentRolesCatalog } from "../queries/get-add-employee"

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
                  <div className="flex h-7 items-center justify-between bg-[#F3F4F6] px-4 text-[10px] font-semibold text-[#374151]">
                    <span>{group.department}</span>
                    <button
                      type="button"
                      onClick={() => toggleDepartment(group.department)}
                      className={`flex size-4.5  items-center justify-center rounded-[6px] border shadow-sm transition-all ${
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
                          className={`group relative flex cursor-pointer items-center justify-between px-9 py-1 text-left transition-colors ${
                            isSelected ? "bg-[#F3F0FF]" : "hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2 ">
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
export function SecurityAssignmentsPanel() {
  const departmentRolesQuery = useGetDepartmentRolesCatalog()
  const { watch, control, setValue } = useFormContext<UserModuleFormValues>()
  const employeeName = `${watch("firstName") ?? ""} ${watch("lastName") ?? ""}`.trim()
  const assignedRoles = watch("roleAssignments") ?? []

  const allRoleItems = useMemo<AddEmployeeSecurityRoleItem[]>(() => {
    const catalog = departmentRolesQuery.data ?? []
    const items: AddEmployeeSecurityRoleItem[] = catalog.map((row) => ({
      id: row.id,
      name: row.name,
      department: row.department,
    }))

    const knownNames = new Set(items.map((i) => i.name))
    for (const role of assignedRoles) {
      if (!knownNames.has(role)) {
        items.push({
          id: `Other:${normalizeRoleId(role)}`,
          name: role,
          department: "Other",
        })
      }
    }

    return items
  }, [assignedRoles, departmentRolesQuery.data])

  const isAssignedName = (name: string) => assignedRoles.includes(name)

  const unassignedItems = useMemo(
    () => allRoleItems.filter((i) => !isAssignedName(i.name)),
    [allRoleItems, assignedRoles],
  )
  const assignedItems = useMemo(
    () => allRoleItems.filter((i) => isAssignedName(i.name)),
    [allRoleItems, assignedRoles],
  )

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

  const transferToAssigned = () => {
    if (toggledU.length === 0) return
    const namesToAdd = unassignedItems.filter((i) => toggledU.includes(i.id)).map((i) => i.name)
    const next = Array.from(new Set([...assignedRoles, ...namesToAdd]))
    setValue("roleAssignments", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
    setToggledU([])
  }

  const transferToUnassigned = () => {
    if (toggledA.length === 0) return
    const namesToRemove = assignedItems.filter((i) => toggledA.includes(i.id)).map((i) => i.name)
    const next = assignedRoles.filter((r) => !namesToRemove.includes(r))
    setValue("roleAssignments", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
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

        <div className="flex flex-col gap-3 pt-12">
          <button
            type="button"
            onClick={transferToAssigned}
            disabled={toggledU.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Move selected to assigned"
          >
            <ChevronRight className="size-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={transferToUnassigned}
            disabled={toggledA.length === 0}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Move selected to unassigned"
          >
            <ChevronLeft className="size-5 stroke-[2.5]" />
          </button>
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
