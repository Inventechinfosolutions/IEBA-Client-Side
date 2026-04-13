import { useMemo, useState, type CSSProperties } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { CSS } from "@dnd-kit/utilities"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Controller, useFieldArray, useFormContext } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { SingleSelectDropdown } from "@/components/ui/dropdown"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { SettingsFormSaveSection } from "@/features/settings/enums/setting.enum"
import type { SettingsFormValues } from "@/features/settings/types"

import {
  type ColumnNameSortState,
  type PayrollColumnSettingModel,
  type SortablePayrollRowProps as SortablePayrollRowPropsModel,
  PAYROLL_BY_OPTIONS,
  PAYROLL_TABLE_SCROLL_MAX_HEIGHT_PX,
} from "../types"

const SIX_DOTS_UNIT_PX = 2.5

function SixDotsIcon() {
  const u = `${SIX_DOTS_UNIT_PX}px`
  return (
    <span
      aria-hidden
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(2, ${u})`,
        gridTemplateRows: `repeat(3, ${u})`,
        gap: u,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: SIX_DOTS_UNIT_PX,
            height: SIX_DOTS_UNIT_PX,
            borderRadius: "50%",
            backgroundColor: "#9ca3af",
            display: "block",
          }}
        />
      ))}
    </span>
  )
}

function orderPayrollRowsForDisplay(
  rows: PayrollColumnSettingModel[],
  sortState: ColumnNameSortState,
): PayrollColumnSettingModel[] {
  if (sortState === "none") return rows
  const sorted = [...rows].sort((a, b) => {
    const cmp = a.label.localeCompare(b.label, undefined, {
      numeric: true,
      sensitivity: "base",
    })
    return sortState === "asc" ? cmp : -cmp
  })
  return sorted
}

function SortablePayrollRow({ row, storageIndex, updateRow, isSortingActive }: SortablePayrollRowPropsModel & { isSortingActive: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.key,
    disabled: isSortingActive,
  })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "h-[40px] border-b border-[#eef0f5] transition-colors last:border-b-0 hover:bg-[#FAFAFA] cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30 grayscale",
        isSortingActive && "opacity-80 cursor-default"
      )}
      {...(!isSortingActive ? listeners : {})}
      {...(!isSortingActive ? attributes : {})}
    >
      <TableCell className="w-1/3 border-r border-[#eef0f5] bg-[#FAFAFA] py-1 text-left text-[12px] text-[#111827]">
        <div className="flex items-center gap-2 px-2">
          {!isSortingActive ? (
            <span 
              className="flex items-center justify-center min-w-[20px]"
            >
              <SixDotsIcon />
            </span>
          ) : (
             <span className="w-[20px]" />
          )}
          <span className="select-none pointer-events-none">{row.label}</span>
        </div>
      </TableCell>
      <TableCell className="w-1/3 border-r border-[#eef0f5] py-1 text-center">
        <input
          type="checkbox"
          checked={row.enabled}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => updateRow(storageIndex, { enabled: e.target.checked })}
          className="size-4 cursor-pointer accent-[var(--primary)]"
          aria-label={`${row.label} enabled`}
        />
      </TableCell>
      <TableCell className="w-1/3 py-1 text-center">
        <input
          type="checkbox"
          checked={row.editable}
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => updateRow(storageIndex, { editable: e.target.checked })}
          className="size-4 cursor-pointer accent-[var(--primary)]"
          aria-label={`${row.label} editable`}
        />
      </TableCell>
    </tr>
  )
}

export function PayrollForm() {
  const { control, getValues, trigger, watch } = useFormContext<SettingsFormValues>()
  const { update, replace } = useFieldArray({ control, name: "payroll.columns" })

  const columns = watch("payroll.columns") as PayrollColumnSettingModel[]

  const [columnNameSortState, setColumnNameSortState] = useState<ColumnNameSortState>("none")
  const [columnNameSortTooltipOpen, setColumnNameSortTooltipOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const isSortingActive = columnNameSortState !== "none"

  const displayRows = useMemo(
    () => orderPayrollRowsForDisplay(columns, columnNameSortState),
    [columns, columnNameSortState],
  )

  const updateRow = (index: number, patch: Partial<PayrollColumnSettingModel>) => {
    const current = getValues(`payroll.columns.${index}` as const)
    if (!current) return
    update(index, { ...current, ...patch })
  }

  const handleColumnNameSort = () => {
    setColumnNameSortState((prev) =>
      prev === "none" ? "asc" : prev === "asc" ? "desc" : "none",
    )
  }

  const columnNameSortTooltipText =
    columnNameSortState === "none"
      ? "Click to sort ascending"
      : columnNameSortState === "asc"
        ? "Click to sort descending"
        : "Click to cancel sorting"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    const base = getValues("payroll.columns") as PayrollColumnSettingModel[]
    const oldIndex = base.findIndex((r) => r.key === active.id)
    const newIndex = base.findIndex((r) => r.key === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    replace(arrayMove(base, oldIndex, newIndex))
  }

  const activeRow = activeId ? columns.find(c => c.key === activeId) : null

  return (
    <div className="bg-transparent px-6 py-3">
      <div className="flex items-start gap-8">
        <div className="min-w-0 w-[55%] max-w-full shrink">
          <div className="overflow-hidden rounded-[6px] border border-[#e7e9f2] bg-white">
            <div className="overflow-hidden [scrollbar-gutter:stable]">
              <table className="w-full border-collapse table-fixed text-[12px]">
                <TableHeader className="bg-white">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-[34px] w-1/3 border-b border-r border-[#eef0f5] p-0 text-left align-middle">
                      <TooltipProvider>
                        <Tooltip open={columnNameSortTooltipOpen}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={handleColumnNameSort}
                              onMouseEnter={() => setColumnNameSortTooltipOpen(true)}
                              onMouseLeave={() => setColumnNameSortTooltipOpen(false)}
                              onFocus={() => setColumnNameSortTooltipOpen(true)}
                              onBlur={() => setColumnNameSortTooltipOpen(false)}
                              className="relative box-border flex h-[34px] w-full cursor-pointer items-center justify-start px-3 pr-7 text-left text-[12px] font-normal text-[var(--primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
                            >
                              <span>Column Name</span>
                              <span className="pointer-events-none absolute right-2 inline-flex flex-col items-center leading-none text-[var(--primary)]">
                                <ChevronUp
                                  className={cn(
                                    "size-[10px]",
                                    columnNameSortState === "asc"
                                      ? "text-[var(--primary)]"
                                      : "text-[var(--primary)]/50",
                                  )}
                                  aria-hidden
                                />
                                <ChevronDown
                                  className={cn(
                                    "-mt-1 size-[10px]",
                                    columnNameSortState === "desc"
                                      ? "text-[var(--primary)]"
                                      : "text-[var(--primary)]/50",
                                  )}
                                  aria-hidden
                                />
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            {columnNameSortTooltipText}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableHead>
                    <TableHead className="h-[34px] w-1/3 border-b border-r border-[#eef0f5] text-center text-[12px] font-normal text-[var(--primary)]">
                      Disable/Enable
                    </TableHead>
                    <TableHead className="h-[34px] w-1/3 border-b border-[#eef0f5] text-center text-[12px] font-normal text-[var(--primary)]">
                      Editable
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </table>
            </div>

            <div
              className="min-h-0 overflow-y-scroll overflow-x-hidden bg-white [scrollbar-gutter:stable]"
              style={{ maxHeight: `${PAYROLL_TABLE_SCROLL_MAX_HEIGHT_PX}px` }}
            >
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCorners} 
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <table className="w-full border-collapse table-fixed text-[12px]">
                  <SortableContext
                    items={displayRows.map((r) => r.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <TableBody className="bg-white">
                      {displayRows.map((row) => {
                        const storageIndex = columns.findIndex((c) => c.key === row.key)
                        if (storageIndex === -1) return null
                        return (
                          <SortablePayrollRow
                            key={row.key}
                            row={row}
                            storageIndex={storageIndex}
                            updateRow={updateRow}
                            isSortingActive={isSortingActive}
                          />
                        )
                      })}
                    </TableBody>
                  </SortableContext>
                </table>
                <DragOverlay dropAnimation={null}>
                  {activeId && activeRow && (
                    <table className="w-full border-collapse table-fixed text-[12px] bg-white shadow-xl opacity-90 border border-[var(--primary)]/20 rounded-md overflow-hidden">
                      <tbody>
                        <tr className="h-[40px] flex items-center">
                          <td className="w-1/3 border-r border-[#eef0f5] bg-[#FAFAFA] py-1 text-left px-2 flex items-center gap-2">
                            <SixDotsIcon />
                            <span className="font-medium">{activeRow.label}</span>
                          </td>
                          <td className="w-1/3 border-r border-[#eef0f5] py-1 text-center">
                             <input type="checkbox" checked={activeRow.enabled} readOnly className="size-4" />
                          </td>
                          <td className="w-1/3 py-1 text-center">
                             <input type="checkbox" checked={activeRow.editable} readOnly className="size-4" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>

        <div className="w-[280px] shrink-0">
          <label className="mb-2 block text-[12px] font-medium text-[#111827]">Payroll By</label>
          <Controller
            name="payroll.payrollBy"
            control={control}
            render={({ field }) => (
              <SingleSelectDropdown
                value={field.value ?? ""}
                onChange={(val) => {
                  field.onChange(val)
                }}
                onBlur={field.onBlur}
                options={PAYROLL_BY_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                placeholder="Payroll by"
                className="!h-[46px] !min-h-[46px] w-[160px] shrink-0 !rounded-[6px] !border-[#d6d7dc] !pl-3 !pr-9 !text-[14px] !font-normal hover:bg-[#f2f2f2]"
                itemButtonClassName="rounded-[6px] px-1.5 py-2"
                itemLabelClassName="!text-[14px] !font-normal"
              />
            )}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          data-settings-section={SettingsFormSaveSection.Payroll}
          className="h-[44px] min-w-[120px] rounded-[8px] bg-[var(--primary)] px-8 text-[12px] font-medium text-white hover:bg-[var(--primary)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
