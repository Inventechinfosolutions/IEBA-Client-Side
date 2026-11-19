import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import type {
  ReportsTransferDirection,
  ReportsTransferItem,
} from "@/features/settings/components/Reports/reportsTransfer.types"
import {
  applyTransferBucketMove,
  filterReportsTransferItems,
  pruneActivityCodesNotInSet,
} from "@/features/settings/components/Reports/reportsTransfer.utils"

type ReportsBucketTransferProps = {
  unassignedTitle: string
  assignedTitle: string
  loadingLabel: string
  includedField: "reports.includedMasterCodeIds" | "reports.includedActivityCodes"
  excludedField: "reports.excludedMasterCodeIds" | "reports.excludedActivityCodes"
  unassignedItems: ReportsTransferItem[]
  assignedItems: ReportsTransferItem[]
  isLoading?: boolean
  isSaving?: boolean
  disabled?: boolean
  /**
   * When unassigning master codes, resolve activity codes that belonged to those MCs
   * so only those activities are dropped (other MCs' activities stay assigned).
   */
  getActivityCodesToDropOnUnassign?: (unassignedMasterCodeIds: string[]) => Promise<string[]>
  containerClassName?: string
  onSave: (direction: ReportsTransferDirection) => void
  onFetchModeChange: (direction: ReportsTransferDirection) => void
}

export function ReportsBucketTransfer({
  unassignedTitle,
  assignedTitle,
  loadingLabel,
  includedField,
  excludedField,
  unassignedItems,
  assignedItems,
  isLoading = false,
  isSaving = false,
  disabled = false,
  getActivityCodesToDropOnUnassign,
  containerClassName = "mt-4",
  onSave,
  onFetchModeChange,
}: ReportsBucketTransferProps) {
  const { watch, setValue, getValues } = useFormContext<SettingsFormValues>()

  const assignedIds = watch(includedField) ?? []
  const unassignedIds = watch(excludedField) ?? []

  const [searchUnassigned, setSearchUnassigned] = useState("")
  const [searchAssigned, setSearchAssigned] = useState("")
  const [toggledUnassigned, setToggledUnassigned] = useState<string[]>([])
  const [toggledAssigned, setToggledAssigned] = useState<string[]>([])
  const [isPruningActivities, setIsPruningActivities] = useState(false)

  const filteredUnassigned = useMemo(
    () => filterReportsTransferItems(unassignedItems, searchUnassigned),
    [unassignedItems, searchUnassigned],
  )

  const filteredAssigned = useMemo(
    () => filterReportsTransferItems(assignedItems, searchAssigned),
    [assignedItems, searchAssigned],
  )

  const isDisabled = disabled || isSaving || isLoading || isPruningActivities

  const syncFormAndSave = async (
    nextAssignedIds: string[],
    nextUnassignedIds: string[],
    direction: ReportsTransferDirection,
    movedIds: string[],
  ) => {
    setValue(includedField, nextAssignedIds, { shouldDirty: true })
    setValue(excludedField, nextUnassignedIds, { shouldDirty: true })

    // Assign: keep existing activity mappings.
    // Unassign: drop only activities that belonged to the removed master code(s).
    if (direction === "unassign" && getActivityCodesToDropOnUnassign && movedIds.length > 0) {
      setIsPruningActivities(true)
      try {
        const codesToDrop = await getActivityCodesToDropOnUnassign(movedIds)
        if (codesToDrop.length > 0) {
          const included = getValues("reports.includedActivityCodes") ?? []
          const excluded = getValues("reports.excludedActivityCodes") ?? []
          setValue("reports.includedActivityCodes", pruneActivityCodesNotInSet(included, codesToDrop), {
            shouldDirty: true,
          })
          setValue("reports.excludedActivityCodes", pruneActivityCodesNotInSet(excluded, codesToDrop), {
            shouldDirty: true,
          })
        }
      } finally {
        setIsPruningActivities(false)
      }
    }

    onFetchModeChange(direction)
    queueMicrotask(() => onSave(direction))
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToAssigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedIds, unassignedIds, ids, "toAssigned")
    setToggledUnassigned([])
    void syncFormAndSave(next.assignedIds, next.unassignedIds, "assign", ids)
  }

  const moveToUnassigned = (ids: string[]) => {
    if (ids.length === 0 || isDisabled) return
    const next = applyTransferBucketMove(assignedIds, unassignedIds, ids, "toUnassigned")
    setToggledAssigned([])
    void syncFormAndSave(next.assignedIds, next.unassignedIds, "unassign", ids)
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
    <div className={containerClassName}>
      <div className="grid w-full max-w-[1120px] grid-cols-1 items-center gap-3 lg:grid-cols-[1fr_60px_1fr] lg:gap-4">
        <ReportsTransferPanel
          title={unassignedTitle}
          items={filteredUnassigned}
          selectedIds={toggledUnassigned}
          onToggleItem={(id) => handleToggle(id, setToggledUnassigned)}
          onToggleAll={toggleAllUnassigned}
          searchValue={searchUnassigned}
          onSearchChange={setSearchUnassigned}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          disabled={isDisabled}
          emptyMessage="No unassigned items — everything available is already assigned, or none are available for this report"
        />

        <div className="flex items-center justify-center gap-3 py-2 lg:flex-col lg:py-0 lg:pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={isDisabled || toggledUnassigned.length === 0}
            aria-label={`Assign selected ${assignedTitle.toLowerCase()} and save`}
            onClick={() => moveToAssigned(toggledUnassigned)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={isDisabled || toggledAssigned.length === 0}
            aria-label={`Unassign selected ${assignedTitle.toLowerCase()} and save`}
            onClick={() => moveToUnassigned(toggledAssigned)}
          />
        </div>

        <ReportsTransferPanel
          title={assignedTitle}
          items={filteredAssigned}
          selectedIds={toggledAssigned}
          onToggleItem={(id) => handleToggle(id, setToggledAssigned)}
          onToggleAll={toggleAllAssigned}
          searchValue={searchAssigned}
          onSearchChange={setSearchAssigned}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          disabled={isDisabled}
          emptyMessage="No assigned items yet — select from the left and move them here"
        />
      </div>
    </div>
  )
}
