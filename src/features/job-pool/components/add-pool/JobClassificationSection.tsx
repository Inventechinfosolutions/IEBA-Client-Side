 import type { Dispatch, SetStateAction } from "react"
import { useState, useMemo } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { TransferPanel } from "./TransferPanel"
import type { TransferItem, JobClassificationSectionProps } from "../../types"

import { useGetJobClassificationGroupedByDepartment } from "../../../job-classification/queries/getJobClassifications"
import type { JobClassificationSimpleItem } from "../../../job-classification/types"

export function JobClassificationSection({
  form,
  mode,
  assignedJobClassificationDetails,
  unassignedJobClassificationDetails,
  assigned,
  assignedToOtherPoolsInDept,
  unassigned,
}: JobClassificationSectionProps) {
  const selectedDept = form.watch("department")

  const [searchU, setSearchU] = useState("")
  const [searchA, setSearchA] = useState("")

  // ── NEW: fetch grouped classifications whenever department changes ──────────
  const { data: grouped } = useGetJobClassificationGroupedByDepartment(
    selectedDept ? Number(selectedDept) : null,
    { enabled: mode !== "edit" }
  )

  // ── Build item catalog ──────────────────────────────────────────────────────
  // Priority: when the grouped API has data (dept selected), use it.
  // Fallback: seed from the edit-mode details passed in via props.
  const itemCatalog = useMemo(() => {
    const catalog: Record<string, JobClassificationSimpleItem> = {}

    if (grouped) {
      // Fresh data from new API — authoritative source
      ;[...grouped.assigned, ...grouped.unassigned].forEach((jc) => {
        catalog[String(jc.id)] = jc
      })
    } else {
      // Fallback while API loads or no dept selected (edit mode seed)
      const listA = assigned ?? assignedJobClassificationDetails ?? []
      const listU = unassigned ?? unassignedJobClassificationDetails ?? []
      const listO = assignedToOtherPoolsInDept ?? []

      ;[...listA, ...listU, ...listO].forEach((jc) => {
        catalog[String(jc.id)] = {
          id: Number(jc.id),
          code: jc.code,
          name: jc.name,
          status: jc.status ?? "active",
          users: 'users' in jc && Array.isArray(jc.users) ? jc.users : [],
        }
      })
    }

    return catalog
  }, [grouped, assignedJobClassificationDetails, unassignedJobClassificationDetails, assigned, unassigned, assignedToOtherPoolsInDept])

  // ── Disabled set: IDs already assigned to another pool in this dept ──────────
  const disabledIds = useMemo<Set<string>>(() => {
    if (grouped) {
      return new Set(grouped.assigned.map((jc) => String(jc.id)))
    }
    if (assignedToOtherPoolsInDept) {
      return new Set(assignedToOtherPoolsInDept.map((jc) => String(jc.id)))
    }
    return new Set()
  }, [grouped, assignedToOtherPoolsInDept])

  const assignedIds = form.watch("assignedJobClassificationIds")

  // Build the flat TransferItem list from the catalog.
  // All items appear in the left (unassigned) panel.
  // Items in disabledIds are greyed out and non-transferable.
  const allJobClasses = useMemo<TransferItem[]>(() => {
    return Object.values(itemCatalog).map((jc) => ({
      id: String(jc.id),
      name: jc.name,
      code: jc.code,
      disabled: disabledIds.has(String(jc.id)),
    }))
  }, [itemCatalog, disabledIds])

  const [toggledU, setToggledU] = useState<string[]>([])
  const [toggledA, setToggledA] = useState<string[]>([])

  const getFilteredUnassigned = (items: TransferItem[], assignedIds: string[], search: string) => {
    // Show everything NOT yet moved to the right panel (preserve disabled state)
    const assignedSet = new Set(assignedIds)
    const list = items.filter((i) => !assignedSet.has(i.id))
    if (!search.trim()) return list
    return list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  }

  const getFilteredAssigned = (items: TransferItem[], assignedIds: string[], search: string) => {
    // Show only items moved to the right panel, always unlocked
    const assignedSet = new Set(assignedIds)
    const list = items.filter((i) => assignedSet.has(i.id)).map((i) => ({ ...i, disabled: false }))
    if (!search.trim()) return list
    return list.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
  }

  const filteredU = getFilteredUnassigned(allJobClasses, assignedIds, searchU)
  const filteredA = getFilteredAssigned(allJobClasses, assignedIds, searchA)

  const handleTransfer = (idsToTransfer: string[], isMovingToAssigned: boolean) => {
    // Filter out disabled items — they must never be transferred
    const transferable = idsToTransfer.filter((id) => !disabledIds.has(id))
    if (transferable.length === 0) return

    const current = form.getValues("assignedJobClassificationIds")
    let newClassifications: string[]

    if (isMovingToAssigned) {
      newClassifications = [...new Set([...current, ...transferable])]
    } else {
      newClassifications = current.filter((id) => !transferable.includes(id))
    }

    // 1. Update classifications
    form.setValue("assignedJobClassificationIds", newClassifications)

    // 2. Auto-sync employees linked to the selected classifications
    if (newClassifications.length > 0) {
      const assignedUsers = newClassifications.flatMap((id) => {
        const jc = itemCatalog[id]
        return (jc?.users ?? []).map((u) => ({
          id: u.id,
          name: u.name ?? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
        }))
      })
      const uniqueUserIds = [...new Set(assignedUsers.map((u) => String(u.id)))]
      form.setValue("assignedEmployeeIds", uniqueUserIds)
    } else {
      form.setValue("assignedEmployeeIds", [])
    }

    // 3. Reset UI selection
    if (isMovingToAssigned) {
      setToggledU([])
    } else {
      setToggledA([])
    }
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
          disabled={toggledU.length === 0 || toggledU.every((id) => disabledIds.has(id))}
          className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] bg-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20 hover:brightness-110 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
