import { useMemo, useState } from "react"
import { TransferPanel } from "./TransferPanel"
import type { EmployeeSectionProps } from "../../types"
import { useGetJobClassificationGroupedByDepartment } from "../../../job-classification/queries/getJobClassifications"

export function EmployeeSection({ 
  form, 
  mode,
  assignedUserDetails, 
  unassignedUserDetails,
  assigned,
  assignedToOtherPoolsInDept,
  unassigned
}: EmployeeSectionProps) {
  const selectedDept = form.watch("department")

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")

  // Cached — same key as JobClassificationSection, no extra network call
  const { data: grouped } = useGetJobClassificationGroupedByDepartment(
    selectedDept ? Number(selectedDept) : null,
    { enabled: mode !== "edit" }
  )

  const assignedEmployeeIds = form.watch("assignedEmployeeIds") || []

  // ── Build full user map ──────────────────────────────────────────────────────
  const allUsersMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    if (!selectedDept) return map

    // Seed with initial details (edit mode)
    const listA = assignedUserDetails || []
    const listU = unassignedUserDetails || []
    ;[...listA, ...listU].forEach((u) => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, { id: u.id, name: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() })
      }
    })

    // Seed with nested users from new rich classification properties (edit mode)
    const classA = assigned || []
    const classO = assignedToOtherPoolsInDept || []
    const classU = unassigned || []
    ;[...classA, ...classO, ...classU].forEach((jc) => {
      if (jc.users && Array.isArray(jc.users)) {
        jc.users.forEach((u) => {
          if (u.id && !map.has(u.id)) {
            map.set(u.id, { id: u.id, name: u.name ?? "" })
          }
        })
      }
    })

    // Merge users from grouped API (both assigned + unassigned classifications)
    if (grouped) {
      ;[...grouped.assigned, ...grouped.unassigned]
        .flatMap((jc) => jc.users ?? [])
        .forEach((u) => {
          if (u.id && !map.has(u.id)) {
            map.set(u.id, {
              id: u.id,
              name: u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
            })
          }
        })
    }

    return map
  }, [grouped, selectedDept, assignedUserDetails, unassignedUserDetails, assigned, assignedToOtherPoolsInDept, unassigned])



  // ── Filter lists ─────────────────────────────────────────────────────────────
  const unassignedUsers = useMemo(() => {
    const assignedSet = new Set(assignedEmployeeIds)
    const list = Array.from(allUsersMap.values()).filter((u) => !assignedSet.has(u.id))
    if (!searchU.trim()) return list
    return list.filter((u) => u.name.toLowerCase().includes(searchU.toLowerCase()))
  }, [allUsersMap, assignedEmployeeIds, searchU])

  const assignedUsers = useMemo(() => {
    const list = assignedEmployeeIds.map((id) => allUsersMap.get(id)).filter(Boolean) as { id: string; name: string }[]
    if (!searchA.trim()) return list
    return list.filter((u) => u.name.toLowerCase().includes(searchA.toLowerCase()))
  }, [assignedEmployeeIds, allUsersMap, searchA])

  return (
    <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-4">
      <TransferPanel
        title="Unassigned Employee"
        items={unassignedUsers}
        selectedIds={[]}
        onToggleItem={() => {}}
        searchValue={searchU}
        onSearchChange={setSearchU}
        count={unassignedUsers.length}
        isListDisabled={true}
      />
      <div className="flex flex-col gap-3 pt-12">
        <div className="size-11" />
        <div className="size-11" />
      </div>
      <TransferPanel
        title="Assigned Employee"
        items={assignedUsers}
        selectedIds={[]}
        onToggleItem={() => {}}
        searchValue={searchA}
        onSearchChange={setSearchA}
        count={assignedUsers.length}
        isListDisabled={true}
      />
    </div>
  )
}
