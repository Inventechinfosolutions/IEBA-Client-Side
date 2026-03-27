import type { Dispatch, SetStateAction } from "react"
import { useState, useMemo } from "react"
import type { UseFormReturn } from "react-hook-form"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { TransferPanel } from "./TransferPanel"
import type { JobPoolFormValues, TransferItem } from "../../types"
import { useGetCountyActivityCodes } from "../../../CountyActivityCode/queries/getCountyActivityCodes"

interface ActivitySectionProps {
  form: UseFormReturn<JobPoolFormValues, any, any>
}

export function ActivitySection({ form }: ActivitySectionProps) {
  const selectedDept = form.watch("department")
  const { data: activitiesData = [] } = useGetCountyActivityCodes()
  
  const allActivities = useMemo(() => {
    if (!selectedDept) return []
    return activitiesData.map(a => ({ 
      id: a.id, 
      name: a.countyActivityName,
      code: a.countyActivityCode 
    })) ?? []
  }, [activitiesData, selectedDept])

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")
  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const assignedIds = form.watch("assignedActivityIds")

  const getFiltered = (items: TransferItem[], assignedIds: string[], search: string, isAssigned: boolean) => {
    const list = isAssigned 
      ? items.filter(i => assignedIds.includes(i.id))
      : items.filter(i => !assignedIds.includes(i.id))
    
    if (!search.trim()) return list
    return list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
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
        selectedDept={selectedDept}
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
        selectedDept={selectedDept}
      />
    </div>
  )
}
