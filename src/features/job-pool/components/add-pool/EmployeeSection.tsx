import { useMemo, useState } from "react"
import { TransferPanel } from "./TransferPanel"
import type { EmployeeSectionProps } from "../../types"
import { useGetAllJobClassifications } from "../../../job-classification/queries/getJobClassifications"
export function EmployeeSection({ 
  form, 
  mode,
  assignedUserDetails, 
  unassignedUserDetails 
}: EmployeeSectionProps) {
  const selectedDept = form.watch("department")


  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")

  const shouldFetch = !!selectedDept && (mode === "add" || !!searchU || !!searchA);

  // Fetch ALL classifications (no dept filter) so users are always found
  const { data: jobClassesData } = useGetAllJobClassifications(undefined, { enabled: shouldFetch })

  const assignedEmployeeIds = form.watch("assignedEmployeeIds") || []

  const allUsersMap = useMemo(() => {
    const map = new Map()
    if (!selectedDept) return map

    // Seed with initial details
    const assigned = assignedUserDetails || [];
    const unassigned = unassignedUserDetails || [];
    [...assigned, ...unassigned].forEach(u => {
      if (u.id && !map.has(u.id)) {
        map.set(u.id, { id: u.id, name: u.name || `${u.firstName} ${u.lastName}`.trim() });
      }
    });

    // Merge with API data
    const items = jobClassesData ?? []
    items
      .flatMap(jc => jc.users || [])
      .forEach(u => {
        if (u.id && !map.has(u.id)) {
          map.set(u.id, { id: u.id, name: u.name })
        }
      })
    return map
  }, [jobClassesData, selectedDept, assignedUserDetails, unassignedUserDetails])

  const assignedUsers = useMemo(() => {
    return assignedEmployeeIds
      .map(id => allUsersMap.get(id))
      .filter(Boolean)
  }, [assignedEmployeeIds, allUsersMap])

  const unassignedUsers = useMemo(() => {
    const assignedSet = new Set(assignedEmployeeIds)
    return Array.from(allUsersMap.values()).filter(
      u => !assignedSet.has(u.id)
    )
  }, [assignedEmployeeIds, allUsersMap])

  const filteredU = searchU.trim()
    ? unassignedUsers.filter(u => u.name.toLowerCase().includes(searchU.toLowerCase()))
    : unassignedUsers

  const filteredA = searchA.trim()
    ? assignedUsers.filter(u => u.name.toLowerCase().includes(searchA.toLowerCase()))
    : assignedUsers

  return (
    <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-4">
      <TransferPanel
        title="Unassigned Employee"
        items={filteredU}
        selectedIds={[]}
        onToggleItem={() => {}}
        searchValue={searchU}
        onSearchChange={setSearchU}
        count={filteredU.length}
        isSearchDisabled={false}
        isListDisabled={true}
      />
      <div className="flex flex-col gap-3 pt-12">
        <div className="size-11" />
        <div className="size-11" />
      </div>
      <TransferPanel
        title="Assigned Employee"
        items={filteredA}
        selectedIds={[]}
        onToggleItem={() => {}}
        searchValue={searchA}
        onSearchChange={setSearchA}
        count={filteredA.length}
        isSearchDisabled={false}
        isListDisabled={true}
      />
    </div>
  )
}
