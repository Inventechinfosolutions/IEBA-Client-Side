import { useMemo, useState } from "react"
import { TransferPanel } from "./TransferPanel"
import type { EmployeeSectionProps } from "../../types"
import { useGetJobClassifications } from "../../../job-classification/queries/getJobClassifications"

export function EmployeeSection({ form }: EmployeeSectionProps) {
  const selectedDept = form.watch("department")
  const assignedClassIds = form.watch("assignedJobClassificationIds") || []

  // Fetch ALL classifications (no dept filter) so users are always found
  const { data: jobClassesData } = useGetJobClassifications({
    page: 1,
    pageSize: 100,
    search: "",
    inactiveOnly: false,
  })

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")

  // ASSIGNED employees = users from ASSIGNED classifications (right panel)
  const assignedUsers = useMemo(() => {
    if (!selectedDept || assignedClassIds.length === 0) return []
    const items = jobClassesData?.items ?? []
    const uniqueMap = new Map()
    items
      .filter(jc => assignedClassIds.includes(String(jc.id)))
      .flatMap(jc => jc.users || [])
      .forEach(u => {
        if (u.id && !uniqueMap.has(u.id)) {
          uniqueMap.set(u.id, { id: u.id, name: u.name })
        }
      })
    return Array.from(uniqueMap.values())
  }, [jobClassesData, selectedDept, assignedClassIds])

  // UNASSIGNED employees = users from UNASSIGNED classifications (left panel)
  // Exclude users who already appear in Assigned panel
  const unassignedUsers = useMemo(() => {
    if (!selectedDept) return []
    const assignedUserIds = new Set(assignedUsers.map(u => u.id))
    const items = jobClassesData?.items ?? []
    const uniqueMap = new Map()
    items
      .filter(jc => !assignedClassIds.includes(String(jc.id)))
      .flatMap(jc => jc.users || [])
      .forEach(u => {
        if (u.id && !assignedUserIds.has(u.id) && !uniqueMap.has(u.id)) {
          uniqueMap.set(u.id, { id: u.id, name: u.name })
        }
      })
    return Array.from(uniqueMap.values())
  }, [jobClassesData, selectedDept, assignedClassIds, assignedUsers])

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
