import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { useReportActivityBuckets } from "@/features/settings/queries/getReportActivityBuckets"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import {
  applyTransferPickerMove,
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

  const mode = watch("reports.activityExclusionMode") === "exclude" ? "exclude" : "include"
  const includedMasterCodeIds = watch("reports.includedMasterCodeIds") ?? []
  const selectedCodes =
    mode === "include"
      ? (watch("reports.includedActivityCodes") ?? [])
      : (watch("reports.excludedActivityCodes") ?? [])

  const activitiesEnabled = enabled && Boolean(reportKey) && includedMasterCodeIds.length > 0

  const { data: buckets, isPending, isFetching } = useReportActivityBuckets(
    includedMasterCodeIds,
    selectedCodes,
    mode,
    activitiesEnabled,
  )
  const isLoading = activitiesEnabled && (isPending || isFetching)

  const excludedItems = useMemo(
    () => flattenActivityBucketRows(buckets?.excluded ?? []),
    [buckets?.excluded],
  )

  const includedItems = useMemo(
    () => flattenActivityBucketRows(buckets?.included ?? []),
    [buckets?.included],
  )

  const [searchExcluded, setSearchExcluded] = useState("")
  const [searchIncluded, setSearchIncluded] = useState("")
  const [toggledExcluded, setToggledExcluded] = useState<string[]>([])
  const [toggledIncluded, setToggledIncluded] = useState<string[]>([])

  const filteredExcluded = useMemo(
    () => filterReportsTransferItems(excludedItems, searchExcluded),
    [excludedItems, searchExcluded],
  )

  const filteredIncluded = useMemo(
    () => filterReportsTransferItems(includedItems, searchIncluded),
    [includedItems, searchIncluded],
  )

  const disabled = !activitiesEnabled || isSaving || isLoading

  const syncFormAndSave = (nextSelectedCodes: string[]) => {
    if (mode === "include") {
      setValue("reports.includedActivityCodes", nextSelectedCodes, { shouldDirty: true })
    } else {
      setValue("reports.excludedActivityCodes", nextSelectedCodes, { shouldDirty: true })
    }
    queueMicrotask(onSave)
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToIncluded = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferPickerMove(mode, selectedCodes, ids, "toIncludedPanel")
    setToggledExcluded([])
    syncFormAndSave(next)
  }

  const moveToExcluded = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferPickerMove(mode, selectedCodes, ids, "toExcludedPanel")
    setToggledIncluded([])
    syncFormAndSave(next)
  }

  const toggleAllExcluded = () => {
    setToggledExcluded((prev) =>
      prev.length === filteredExcluded.length ? [] : filteredExcluded.map((item) => item.id),
    )
  }

  const toggleAllIncluded = () => {
    setToggledIncluded((prev) =>
      prev.length === filteredIncluded.length ? [] : filteredIncluded.map((item) => item.id),
    )
  }

  if (!includedMasterCodeIds.length) {
    return (
      <p className="mt-6 text-[12px] text-[#6B7280]">
        Include at least one master code to load activities.
      </p>
    )
  }

  return (
    <div className="mt-6">
      <div className="grid max-w-[1120px] grid-cols-[1fr_60px_1fr] items-center gap-4">
        <ReportsTransferPanel
          title="Excluded Activities"
          items={filteredExcluded}
          selectedIds={toggledExcluded}
          onToggleItem={(id) => handleToggle(id, setToggledExcluded)}
          onToggleAll={toggleAllExcluded}
          searchValue={searchExcluded}
          onSearchChange={setSearchExcluded}
          isLoading={isLoading}
          loadingLabel="Loading activities…"
          disabled={disabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={disabled || toggledExcluded.length === 0}
            aria-label="Include selected activities and save"
            onClick={() => moveToIncluded(toggledExcluded)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={disabled || toggledIncluded.length === 0}
            aria-label="Exclude selected activities and save"
            onClick={() => moveToExcluded(toggledIncluded)}
          />
        </div>

        <ReportsTransferPanel
          title="Included Activities"
          items={filteredIncluded}
          selectedIds={toggledIncluded}
          onToggleItem={(id) => handleToggle(id, setToggledIncluded)}
          onToggleAll={toggleAllIncluded}
          searchValue={searchIncluded}
          onSearchChange={setSearchIncluded}
          isLoading={isLoading}
          loadingLabel="Loading activities…"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
