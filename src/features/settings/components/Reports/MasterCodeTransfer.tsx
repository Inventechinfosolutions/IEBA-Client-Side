import { useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { useFormContext } from "react-hook-form"

import { TransferListMoveButton } from "@/components/ui/transfer-list-move-button"
import type { SettingsFormValues } from "@/features/settings/types"
import { useReportMasterCodeBuckets } from "@/features/settings/queries/getReportMasterCodeBuckets"
import { ReportsTransferPanel } from "@/features/settings/components/Reports/ReportsTransferPanel"
import {
  applyTransferPickerMove,
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

  const mode = watch("reports.masterCodeExclusionMode") === "exclude" ? "exclude" : "include"
  const selectedIds =
    mode === "include"
      ? (watch("reports.includedMasterCodeIds") ?? [])
      : (watch("reports.excludedMasterCodeIds") ?? [])

  const { data: buckets, isPending, isFetching } = useReportMasterCodeBuckets(
    selectedIds,
    mode,
    enabled && Boolean(reportKey),
  )
  const isLoading = isPending || isFetching

  const excludedItems = useMemo(
    () => (buckets?.excluded ?? []).map(masterCodeRowToTransferItem),
    [buckets?.excluded],
  )

  const includedItems = useMemo(
    () => (buckets?.included ?? []).map(masterCodeRowToTransferItem),
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

  const disabled = !reportKey || isSaving || isLoading

  const syncFormAndSave = (nextSelectedIds: string[]) => {
    if (mode === "include") {
      setValue("reports.includedMasterCodeIds", nextSelectedIds, { shouldDirty: true })
    } else {
      setValue("reports.excludedMasterCodeIds", nextSelectedIds, { shouldDirty: true })
    }
    setValue("reports.excludedActivityCodes", [])
    setValue("reports.includedActivityCodes", [])
    queueMicrotask(onSave)
  }

  const handleToggle = (id: string, setState: Dispatch<SetStateAction<string[]>>) => {
    setState((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const moveToIncluded = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferPickerMove(mode, selectedIds, ids, "toIncludedPanel")
    setToggledExcluded([])
    syncFormAndSave(next)
  }

  const moveToExcluded = (ids: string[]) => {
    if (ids.length === 0 || disabled) return
    const next = applyTransferPickerMove(mode, selectedIds, ids, "toExcludedPanel")
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

  return (
    <div className="mt-4">
      <div className="grid max-w-[1120px] grid-cols-[1fr_60px_1fr] items-center gap-4">
        <ReportsTransferPanel
          title="Excluded Master Codes"
          items={filteredExcluded}
          selectedIds={toggledExcluded}
          onToggleItem={(id) => handleToggle(id, setToggledExcluded)}
          onToggleAll={toggleAllExcluded}
          searchValue={searchExcluded}
          onSearchChange={setSearchExcluded}
          isLoading={isLoading}
          loadingLabel="Loading master codes…"
          disabled={disabled}
        />

        <div className="flex flex-col gap-3 pt-10">
          <TransferListMoveButton
            direction="forward"
            disabled={disabled || toggledExcluded.length === 0}
            aria-label="Include selected master codes and save"
            onClick={() => moveToIncluded(toggledExcluded)}
          />
          <TransferListMoveButton
            direction="back"
            disabled={disabled || toggledIncluded.length === 0}
            aria-label="Exclude selected master codes and save"
            onClick={() => moveToExcluded(toggledIncluded)}
          />
        </div>

        <ReportsTransferPanel
          title="Included Master Codes"
          items={filteredIncluded}
          selectedIds={toggledIncluded}
          onToggleItem={(id) => handleToggle(id, setToggledIncluded)}
          onToggleAll={toggleAllIncluded}
          searchValue={searchIncluded}
          onSearchChange={setSearchIncluded}
          isLoading={isLoading}
          loadingLabel="Loading master codes…"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
