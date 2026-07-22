import { useMemo, useState } from "react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import type { PayrollManagementRow } from "../types"

export type PayrollEditableColumn = {
  label: string
  editable: boolean
}

function labelToDataKey(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "")
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: PayrollManagementRow | null
  /** Enabled columns in order with editable flags (from settings API). */
  columns: readonly PayrollEditableColumn[]
  isSaving?: boolean
  onSave: (patch: Record<string, string>) => void | Promise<void>
}

export function EditPayrollDataDialog({
  open,
  onOpenChange,
  row,
  columns,
  isSaving = false,
  onSave,
}: Props) {
  const rowDict = useMemo(() => (row ? (row as unknown as Record<string, unknown>) : null), [row])

  const normalizedRowKeyMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!rowDict) return map
    for (const key of Object.keys(rowDict)) {
      const normalized = normalizeKey(key)
      if (!map.has(normalized)) map.set(normalized, key)
    }
    return map
  }, [rowDict])

  const visibleColumns = useMemo(
    () =>
      columns.map((c) => {
        const normalized = labelToDataKey(c.label)
        const rowKey = normalizedRowKeyMap.get(normalized) ?? normalized
        return { label: c.label, dataKey: normalized, rowKey, editable: c.editable }
      }),
    [columns, normalizedRowKeyMap],
  )

  const initialValues = useMemo(() => {
    if (!rowDict) return {} as Record<string, string>
    const dict: Record<string, string> = {}
    for (const col of visibleColumns) {
      const v = rowDict[col.rowKey]
      dict[col.dataKey] = v === null || v === undefined ? "" : String(v)
    }
    return dict
  }, [rowDict, visibleColumns])

  const [values, setValues] = useState<Record<string, string>>({})

  const effectiveValues = useMemo(() => {
    return { ...initialValues, ...values }
  }, [initialValues, values])

  const canSave = row !== null && visibleColumns.some((c) => c.editable) && !isSaving

  const handleChange = (key: string, next: string) => {
    setValues((prev) => ({ ...prev, [key]: next }))
  }

  const handleSave = async () => {
    if (!row) return
    const patch: Record<string, string> = {}
    for (const col of visibleColumns) {
      if (!col.editable) continue
      const k = col.dataKey
      const next = effectiveValues[k] ?? ""
      const prev = initialValues[k] ?? ""
      if (next !== prev) patch[col.rowKey] = next
    }
    if (Object.keys(patch).length === 0) {
      toast.warning("No changes to save.")
      return
    }
    await onSave(patch)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next)
      if (!next) setValues({})
    }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90dvh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-[8px] bg-white dark:bg-[#0c0d12] border border-[#e5e7eb] dark:border-[rgba(108,93,211,0.55)] shadow-[0_12px_28px_rgba(17,24,39,0.16)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.6)]">
        {(isSaving || !row) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[1px]">
            <Spinner className="text-[#6C5DD3]" />
          </div>
        )}
        <DialogHeader className="pb-2">
          <DialogTitle className="text-[16px] sm:text-[18px] font-semibold text-[#111827] dark:text-white">Edit Payroll Data</DialogTitle>
        </DialogHeader>

        {visibleColumns.length === 0 ? (
          <div className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">No enabled columns are available.</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 py-2">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.map((col) => (
                <div key={col.dataKey} className="min-w-0">
                  <div className={cn(
                    "mb-1 text-[12px]",
                    col.editable ? "font-semibold text-[#111827] dark:text-white" : "font-normal text-[#6b7280] dark:text-[#9ca3af]"
                  )}>
                    {col.label}
                  </div>
                  <input
                    value={effectiveValues[col.dataKey] ?? ""}
                    onChange={(e) => handleChange(col.dataKey, e.target.value)}
                    disabled={!col.editable}
                    className={cn(
                      "h-[38px] w-full rounded-[6px] border px-3 text-[13px] outline-none transition-colors",
                      col.editable
                        ? "editable-field-input border-[#6C5DD3] dark:border-[#6C5DD3] bg-white dark:bg-[#09090b] text-[#111827] dark:text-white focus:ring-2 focus:ring-[#6C5DD3]/20"
                        : "cursor-not-allowed border-[#d6d7dc] dark:border-[#27272a] bg-[#f5f6fa] dark:bg-[#141417] text-[#6b7280] dark:text-[#6b7280]",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto h-[40px] dark:border-[#27272a] dark:bg-[#18181b] dark:text-white dark:hover:bg-[#27272a]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="w-full sm:w-auto h-[40px] bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

