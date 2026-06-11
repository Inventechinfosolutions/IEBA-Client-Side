import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import type { ReportsTransferDirection } from "@/features/settings/components/Reports/useReportsTransferSave"
import type { ReportsTransferItem } from "@/features/settings/components/Reports/reportsTransfer.types"
import {
  applyTransferBucketMove,
  filterReportsTransferItems,
} from "@/features/settings/components/Reports/reportsTransfer.utils"

type ActivityTransferProps = {
  unassignedItems: ReportsTransferItem[]
  assignedItems: ReportsTransferItem[]
  isLoading?: boolean
  isSaving?: boolean
  disabled?: boolean
  onSave: (direction: ReportsTransferDirection) => void
  onActivityFetchModeChange: (direction: ReportsTransferDirection) => void
}

export function ActivityTransfer({
  unassignedItems,
  assignedItems,
  isLoading = false,
  isSaving = false,
  disabled = false,
  onSave,
  onActivityFetchModeChange,
}: ActivityTransferProps) {
  const { watch, setValue } = useFormContext<SettingsFormValues>()

  const assignedCodes = watch("reports.includedActivityCodes") ?? []
  const unassignedCodes = watch("reports.excludedActivityCodes") ?? []

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

  const syncFormAndSave = (
    nextAssignedCodes: string[],
    nextUnassignedCodes: string[],
    direction: ReportsTransferDirection,
  ) => {
    setValue("reports.includedActivityCodes", nextAssignedCodes, { shouldDirty: true })
    setValue("reports.excludedActivityCodes", nextUnassignedCodes, { shouldDirty: true })
    onActivityFetchModeChange(direction)
    queueMicrotask(() => onSave(direction))
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToAssigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedCodes, unassignedCodes, ids, "toAssigned")
    setToggledUnassigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds, "assign")
  }

  const moveToUnassigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedCodes, unassignedCodes, ids, "toUnassigned")
    setToggledAssigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds, "unassign")
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
    <div className="mt-6">
      <div className="grid max-w-[1120px] grid-cols-[1fr_60px_1fr] items-center gap-4">
        <ReportsTransferPanel
          title="Unassigned Activities"
          items={filteredUnassigned}
          selectedIds={toggledUnassigned}
          onToggleItem={(id) => handleToggle(id, setToggledUnassigned)}
          onToggleAll={toggleAllUnassigned}
          searchValue={searchUnassigned}
          onSearchChange={setSearchUnassigned}
          isLoading={isLoading}
          loadingLabel="Loading activities…"
          disabled={isDisabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={isDisabled || toggledUnassigned.length === 0}
            aria-label="Assign selected activities and save"
            onClick={() => moveToAssigned(toggledUnassigned)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={isDisabled || toggledAssigned.length === 0}
            aria-label="Unassign selected activities and save"
            onClick={() => moveToUnassigned(toggledAssigned)}
          />
        </div>

        <ReportsTransferPanel
          title="Assigned Activities"
          items={filteredAssigned}
          selectedIds={toggledAssigned}
          onToggleItem={(id) => handleToggle(id, setToggledAssigned)}
          onToggleAll={toggleAllAssigned}
          searchValue={searchAssigned}
          onSearchChange={setSearchAssigned}
          isLoading={isLoading}
          loadingLabel="Loading activities…"
          disabled={isDisabled}
        />
      </div>
    </div>
  )
}
