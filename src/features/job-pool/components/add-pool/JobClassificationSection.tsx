import type { Dispatch, SetStateAction } from "react"
import { useState, useMemo } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { TransferPanel } from "./TransferPanel"
import type { TransferItem, JobClassificationSectionProps } from "../../types"

import { useGetJobClassifications } from "../../../job-classification/queries/getJobClassifications"
export function JobClassificationSection({ form }: JobClassificationSectionProps) {
  const selectedDept = form.watch("department")

  const { data: jobClassesData } = useGetJobClassifications({
    page: 1,
    pageSize: 10000,
    search: "",
    inactiveOnly: false,
  })


  const assignedIds = form.watch("assignedJobClassificationIds")

  const allJobClasses = useMemo(() => {
    if (!selectedDept) return []
    return jobClassesData?.items.map((jc) => ({ 
      id: String(jc.id), 
      name: jc.name,
      disabled: false 
    })) ?? []
  }, [jobClassesData, selectedDept])

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")
  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const getFiltered = (items: TransferItem[], assignedIds: string[], search: string, isAssigned: boolean) => {
    const assignedSet = new Set(assignedIds)
    const list = isAssigned 
      ? items.filter(i => assignedSet.has(i.id)).map(i => ({ ...i, disabled: false }))
      : items.filter(i => !assignedSet.has(i.id))
    
    if (!search.trim()) return list
    return list.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
  }

  const filteredU = getFiltered(allJobClasses, assignedIds, searchU, false)
  const filteredA = getFiltered(allJobClasses, assignedIds, searchA, true)

  const handleTransfer = async (idsToTransfer: string[], isMovingToAssigned: boolean) => {
    const current = form.getValues("assignedJobClassificationIds")
    let newClassifications: string[]

    if (isMovingToAssigned) {
      newClassifications = [...new Set([...current, ...idsToTransfer])]
    } else {
      newClassifications = current.filter(id => !idsToTransfer.includes(id))
    }

    // 1. Update Classifications
    form.setValue("assignedJobClassificationIds", newClassifications)

    // 2. Synchronize Employees (Auto-assign all users linked to these classifications)
    if (newClassifications.length > 0) {
      const assignedUsers = (jobClassesData?.items ?? [])
        .filter(jc => newClassifications.includes(String(jc.id)))
        .flatMap(jc => jc.users || [])
      
      const uniqueUserIds = [...new Set(assignedUsers.map(u => u.id))]
      form.setValue("assignedEmployeeIds", uniqueUserIds)
    } else {
      form.setValue("assignedEmployeeIds", [])
    }

    // 3. Reset UI Selection
    if (isMovingToAssigned) {
      setToggledU([])
    } else {
      setToggledA([])
    }
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="grid grid-cols-[1fr_60px_1fr] items-center gap-4">
      <TransferPanel
        title="Unassigned Job Classifications"
        items={filteredU}
        selectedIds={toggledU}
        onToggleItem={(id) => handleToggle(id, setToggledU)}
        onToggleAll={() => {}}
        searchValue={searchU}
        onSearchChange={setSearchU}
        count={filteredU.length}
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
        title="Assigned Job Classifications"
        items={filteredA}
        selectedIds={toggledA}
        onToggleItem={(id) => handleToggle(id, setToggledA)}
        onToggleAll={() => {}}
        searchValue={searchA}
        onSearchChange={setSearchA}
        count={filteredA.length}
      />
    </div>
  )
}
