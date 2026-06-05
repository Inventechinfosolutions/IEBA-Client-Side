import type { Dispatch, SetStateAction } from "react"
import { useState, useMemo } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { TransferPanel } from "./TransferPanel"
import { useQuery } from "@tanstack/react-query"
import type { TransferItem, ActivitySectionProps } from "../../types"
import { getJobPoolActivitiesByDepartment } from "../../api/jobpool"

export function ActivitySection({ form, mode, departmentName, assignedActivityDetails, unassignedActivityDetails }: ActivitySectionProps) {
  const selectedDept = form.watch("department")
  
  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")
  const activeSearch = searchU || searchA || undefined

  const shouldFetch = !!selectedDept && mode === "add";
  
  const { data: activitiesData = [] } = useQuery({
    queryKey: ["jobPool", "activities-by-dept", selectedDept],
    queryFn: () => getJobPoolActivitiesByDepartment(Number(selectedDept)),
    enabled: shouldFetch,
    staleTime: 30_000,
  })

  // Maintain a catalog of all items we've seen so far
  const [itemCatalog, setItemCatalog] = useState<Record<string, { id: string; name: string; code: string }>>({})

  // Seed catalog with initial details from props
  useMemo(() => {
    const assigned = assignedActivityDetails || [];
    const unassigned = unassignedActivityDetails || [];
    if (assigned.length > 0 || unassigned.length > 0) {
      setItemCatalog(prev => {
        const next = { ...prev }
        assigned.forEach(a => { next[String(a.id)] = { id: String(a.id), name: a.name, code: a.code } })
        unassigned.forEach(a => { next[String(a.id)] = { id: String(a.id), name: a.name, code: a.code } })
        return next
      })
    }
  }, [assignedActivityDetails, unassignedActivityDetails])

  // Merge API results into catalog
  useMemo(() => {
    if (activitiesData.length > 0) {
      setItemCatalog(prev => {
        const next = { ...prev }
        activitiesData.forEach(a => {
          next[String(a.id)] = { id: String(a.id), name: a.name, code: a.code }
        })
        return next
      })
    }
  }, [activitiesData])
  
  const allActivities = useMemo(() => {
    // We always use the catalog as the source of truth, 
    // which contains both initial items and newly searched items.
    return Object.values(itemCatalog).map(a => ({
      id: a.id,
      name: a.name,
      code: a.code,
      disabled: false
    }))
  }, [itemCatalog])

  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const assignedIds = form.watch("assignedActivityIds")

  const getFiltered = (items: TransferItem[], assignedIds: string[], search: string, isAssigned: boolean) => {
    const assignedSet = new Set(assignedIds)
    const list = isAssigned 
      ? items.filter(i => assignedSet.has(i.id))
      : items.filter(i => !assignedSet.has(i.id))
    
    if (!search.trim()) return list
    const term = search.toLowerCase()
    return list.filter(i => 
      i.name.toLowerCase().includes(term) || 
      (i.code && i.code.toLowerCase().includes(term))
    )
  }

  const filteredU = getFiltered(allActivities, assignedIds, searchU, false)
  const filteredA = getFiltered(allActivities, assignedIds, searchA, true)

  const handleTransfer = (idsToTransfer: string[], isMovingToAssigned: boolean) => {
    const current = form.getValues("assignedActivityIds")
    if (isMovingToAssigned) {
      form.setValue("assignedActivityIds", [...new Set([...current, ...idsToTransfer])])
      setToggledU([])
    } else {
      form.setValue("assignedActivityIds", current.filter(id => !idsToTransfer.includes(id)))
      setToggledA([])
    }
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-4">
      <TransferPanel
        title="Select Activity(Unassigned)"
        items={filteredU}
        selectedIds={toggledU}
        onToggleItem={(id) => handleToggle(id, setToggledU)}
        onToggleAll={() => setToggledU(toggledU.length === filteredU.length ? [] : filteredU.map(a => a.id))}
        searchValue={searchU}
        onSearchChange={setSearchU}
        isActivity
        count={filteredU.length}
        selectedDept={departmentName}
      />
      <div className="flex flex-col gap-3 pt-12">
        <button
          type="button"
          onClick={() => handleTransfer(toggledU, true)}
          disabled={toggledU.length === 0}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed"
        >
          <ChevronRight className="size-5 stroke-[2.5]" />
        </button>
        <button
          type="button"
          onClick={() => handleTransfer(toggledA, false)}
          disabled={toggledA.length === 0}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed"
        >
          <ChevronLeft className="size-5 stroke-[2.5]" />
        </button>
      </div>
      <TransferPanel
        title="Select Activity(Assigned)"
        items={filteredA}
        selectedIds={toggledA}
        onToggleItem={(id) => handleToggle(id, setToggledA)}
        onToggleAll={() => setToggledA(toggledA.length === filteredA.length ? [] : filteredA.map(a => a.id))}
        searchValue={searchA}
        onSearchChange={setSearchA}
        isActivity
        count={filteredA.length}
        selectedDept={departmentName}
      />
    </div>
  )
}
