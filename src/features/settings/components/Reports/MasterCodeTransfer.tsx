import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { useReportMasterCodeBuckets } from "@/features/settings/queries/getReportMasterCodeBuckets"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import {
  applyTransferBucketMove,
  filterReportsTransferItems,
  masterCodeRowToTransferItem,
} from "@/features/settings/components/Reports/reportsTransfer.utils"

type MasterCodeTransferProps = {
  reportKey: string
  isSaving?: boolean
  enabled?: boolean
  onSave: () => void
}

export function MasterCodeTransfer({
  reportKey,
  isSaving = false,
  enabled = true,
  onSave,
}: MasterCodeTransferProps) {
  const { watch, setValue } = useFormContext<SettingsFormValues>()

  const assignedIds = watch("reports.includedMasterCodeIds") ?? []
  const unassignedIds = watch("reports.excludedMasterCodeIds") ?? []
  const queryEnabled = enabled && Boolean(reportKey)

  const { data: assignedBuckets, isPending: isAssignedPending, isFetching: isAssignedFetching } =
    useReportMasterCodeBuckets(assignedIds, "include", queryEnabled)

  const {
    data: unassignedBuckets,
    isPending: isUnassignedPending,
    isFetching: isUnassignedFetching,
  } = useReportMasterCodeBuckets(unassignedIds, "exclude", queryEnabled)

  const isLoading =
    isAssignedPending || isAssignedFetching || isUnassignedPending || isUnassignedFetching

  const unassignedItems = useMemo(
    () => (unassignedBuckets?.excluded ?? []).map(masterCodeRowToTransferItem),
    [unassignedBuckets?.excluded],
  )

  const assignedItems = useMemo(
    () => (assignedBuckets?.included ?? []).map(masterCodeRowToTransferItem),
    [assignedBuckets?.included],
  )

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

  const disabled = !reportKey || isSaving || isLoading

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
    if (ids.length === 0 || disabled) return
    const next = applyTransferBucketMove(assignedIds, unassignedIds, ids, "toAssigned")
    setToggledUnassigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds)
  }

  const moveToUnassigned = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
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
          disabled={disabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={disabled || toggledUnassigned.length === 0}
            aria-label="Assign selected master codes and save"
            onClick={() => moveToAssigned(toggledUnassigned)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={disabled || toggledAssigned.length === 0}
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
          disabled={disabled}
        />
      </div>
    </div>
  )
}
