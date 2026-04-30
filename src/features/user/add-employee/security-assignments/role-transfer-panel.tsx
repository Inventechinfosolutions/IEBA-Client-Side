import { Check } from "lucide-react"
import { useMemo } from "react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { ScrollArea } from "@/components/ui/scroll-area"

import type {
  AddEmployeeSecurityRoleItem,
  AddEmployeeSecurityRolePanelProps,
} from "../types"

export function RoleTransferPanel({
  title,
  items,
  selectedIds,
  onToggleItem,
  onToggleAll,
  onToggleDepartmentGroup,
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

    // Use atomic bulk handler to avoid state race conditions from per-item loops
    if (onToggleDepartmentGroup) {
      if (isAllDeptSelected) {
        onToggleDepartmentGroup([], deptIds) // deselect all
      } else {
        const idsToAdd = deptIds.filter((id) => !selectedIds.includes(id))
        onToggleDepartmentGroup(idsToAdd, []) // select missing
      }
      return
    }

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
            <Check className="size-3.5 stroke-3" />
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
                      <Check className="size-3.5 stroke-3" />
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
                            <div className="pl-6 text-[10px] font-medium text-[#111827] whitespace-normal wrap-break-word">
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
                            <Check className="size-3.5 stroke-3" />
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
