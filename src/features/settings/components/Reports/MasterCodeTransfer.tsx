import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import type { ReportsTransferItem } from "@/features/settings/components/Reports/reportsTransfer.types"
import {
  applyTransferBucketMove,
  filterReportsTransferItems,
} from "@/features/settings/components/Reports/reportsTransfer.utils"

type MasterCodeTransferProps = {
  unassignedItems: ReportsTransferItem[]
  assignedItems: ReportsTransferItem[]
  isLoading?: boolean
  isSaving?: boolean
  disabled?: boolean
  onSave: () => void
}

export function MasterCodeTransfer({
  unassignedItems,
  assignedItems,
  isLoading = false,
  isSaving = false,
  disabled = false,
  onSave,
}: MasterCodeTransferProps) {
  const { watch, setValue } = useFormContext<SettingsFormValues>()

  const assignedIds = watch("reports.includedMasterCodeIds") ?? []
  const unassignedIds = watch("reports.excludedMasterCodeIds") ?? []

  const [searchUnassigned, setSearchUnassigned] = useState("")
  const [searchAssigned, setSearchAssigned] = useState("")
  const [toggledUnassigned, setToggledUnassigned] = useState<string[]>([])
  const [toggledAssigned, setToggledAssigned] = useState<string[]>([])

  const filteredUnassigned = useMemo(
    () => filterReportsTransferItems(unassignedItems, searchUnassigned),
    [unassignedItems, searchUnassigned],
  )

  const filteredAssigned = useMemo(
    () => filterReportsTransferItems(assignedItems, searchAssigned),
    [assignedItems, searchAssigned],
  )

  const isDisabled = disabled || isSaving || isLoading

  const syncFormAndSave = (nextAssignedIds: string[], nextUnassignedIds: string[]) => {
    setValue("reports.includedMasterCodeIds", nextAssignedIds, { shouldDirty: true })
    setValue("reports.excludedMasterCodeIds", nextUnassignedIds, { shouldDirty: true })
    setValue("reports.excludedActivityCodes", [])
    setValue("reports.includedActivityCodes", [])
    queueMicrotask(onSave)
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToAssigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedIds, unassignedIds, ids, "toAssigned")
    setToggledUnassigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds)
  }

  const moveToUnassigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedIds, unassignedIds, ids, "toUnassigned")
    setToggledAssigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds)
  }

  const toggleAllUnassigned = () => {
    setToggledUnassigned((prev) =>
      prev.length === filteredUnassigned.length ? [] : filteredUnassigned.map((item) => item.id),
    )
  }

  const toggleAllAssigned = () => {
    setToggledAssigned((prev) =>
      prev.length === filteredAssigned.length ? [] : filteredAssigned.map((item) => item.id),
    )
  }

  return (
    <div className="mt-4">
      <div className="grid max-w-[1120px] grid-cols-[1fr_60px_1fr] items-center gap-4">
        <ReportsTransferPanel
          title="Unassigned Master Codes"
          items={filteredUnassigned}
          selectedIds={toggledUnassigned}
          onToggleItem={(id) => handleToggle(id, setToggledUnassigned)}
          onToggleAll={toggleAllUnassigned}
          searchValue={searchUnassigned}
          onSearchChange={setSearchUnassigned}
          isLoading={isLoading}
          loadingLabel="Loading master codes…"
          disabled={isDisabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={isDisabled || toggledUnassigned.length === 0}
            aria-label="Assign selected master codes and save"
            onClick={() => moveToAssigned(toggledUnassigned)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={isDisabled || toggledAssigned.length === 0}
            aria-label="Unassign selected master codes and save"
            onClick={() => moveToUnassigned(toggledAssigned)}
          />
        </div>

        <ReportsTransferPanel
          title="Assigned Master Codes"
          items={filteredAssigned}
          selectedIds={toggledAssigned}
          onToggleItem={(id) => handleToggle(id, setToggledAssigned)}
          onToggleAll={toggleAllAssigned}
          searchValue={searchAssigned}
          onSearchChange={setSearchAssigned}
          isLoading={isLoading}
          loadingLabel="Loading master codes…"
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}
