import { useMemo, useState } from "react"

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
    await onSave(patch)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      onOpenChange(next)
      if (!next) setValues({})
    }}>
      <DialogContent className="max-w-4xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Edit Payroll Data</DialogTitle>
        </DialogHeader>

        {visibleColumns.length === 0 ? (
          <div className="text-[13px] text-[#6b7280]">No enabled columns are available.</div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleColumns.map((col) => (
                <div key={col.dataKey} className="min-w-0">
                  <div className="mb-1 text-[12px] font-medium text-[#111827]">{col.label}</div>
                  <input
                    value={effectiveValues[col.dataKey] ?? ""}
                    onChange={(e) => handleChange(col.dataKey, e.target.value)}
                    disabled={!col.editable}
                    className={cn(
                      "h-[34px] w-full rounded-[6px] border border-[#d6d7dc] bg-white px-3 text-[13px] outline-none",
                      "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15",
                      !col.editable && "cursor-not-allowed bg-[#f5f6fa] text-[#6b7280]",
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

