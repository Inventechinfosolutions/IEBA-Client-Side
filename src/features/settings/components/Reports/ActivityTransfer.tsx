import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { useReportActivityBuckets } from "@/features/settings/queries/getReportActivityBuckets"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import {
  applyTransferBucketMove,
  filterReportsTransferItems,
  flattenActivityBucketRows,
} from "@/features/settings/components/Reports/reportsTransfer.utils"

type ActivityTransferProps = {
  reportKey: string
  isSaving?: boolean
  enabled?: boolean
  onSave: () => void
}

export function ActivityTransfer({
  reportKey,
  isSaving = false,
  enabled = true,
  onSave,
}: ActivityTransferProps) {
  const { watch, setValue } = useFormContext<SettingsFormValues>()

  const assignedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const assignedCodes = watch("reports.includedActivityCodes") ?? []
  const unassignedCodes = watch("reports.excludedActivityCodes") ?? []

  const activitiesEnabled = enabled && Boolean(reportKey) && assignedMasterCodeIds.length > 0

  const {
    data: assignedBuckets,
    isPending: isAssignedPending,
    isFetching: isAssignedFetching,
  } = useReportActivityBuckets(assignedMasterCodeIds, assignedCodes, "include", activitiesEnabled)

  const {
    data: unassignedBuckets,
    isPending: isUnassignedPending,
    isFetching: isUnassignedFetching,
  } = useReportActivityBuckets(assignedMasterCodeIds, unassignedCodes, "exclude", activitiesEnabled)

  const isLoading =
    activitiesEnabled &&
    (isAssignedPending || isAssignedFetching || isUnassignedPending || isUnassignedFetching)

  const unassignedItems = useMemo(
    () => flattenActivityBucketRows(unassignedBuckets?.excluded ?? []),
    [unassignedBuckets?.excluded],
  )

  const assignedItems = useMemo(
    () => flattenActivityBucketRows(assignedBuckets?.included ?? []),
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

  const disabled = !activitiesEnabled || isSaving || isLoading

  const syncFormAndSave = (nextAssignedCodes: string[], nextUnassignedCodes: string[]) => {
    setValue("reports.includedActivityCodes", nextAssignedCodes, { shouldDirty: true })
    setValue("reports.excludedActivityCodes", nextUnassignedCodes, { shouldDirty: true })
    queueMicrotask(onSave)
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToAssigned = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferBucketMove(assignedCodes, unassignedCodes, ids, "toAssigned")
    setToggledUnassigned([])
    syncFormAndSave(next.assignedIds, next.unassignedIds)
  }

  const moveToUnassigned = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferBucketMove(assignedCodes, unassignedCodes, ids, "toUnassigned")
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

  if (!assignedMasterCodeIds.length) {
    return (
      <p className="mt-6 text-[12px] text-[#6B7280]">
        Assign at least one master code to load activities.
      </p>
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
          disabled={disabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={disabled || toggledUnassigned.length === 0}
            aria-label="Assign selected activities and save"
            onClick={() => moveToAssigned(toggledUnassigned)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={disabled || toggledAssigned.length === 0}
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
          disabled={disabled}
        />
      </div>
    </div>
  )
}
