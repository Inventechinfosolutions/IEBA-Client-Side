import type { CSSProperties } from "react"
import type { Control, FieldArrayWithId } from "react-hook-form"
import { Controller, useWatch } from "react-hook-form"
import { Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { SettingsFormValues } from "@/features/settings/types"
import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"

import {
  HOLIDAY_TABLE_SCROLLBAR_PAD_PX,
  holidayTableBodyScrollMaxHeight,
} from "./types"

const holidayTableHeadClassName = "h-[37.4px]"
const holidayTableBodyRowClassName = "h-[39.6px]"

const tableRowInputClassName =
  "h-[12px] w-full rounded-none border-0 bg-transparent px-3 text-center !text-[12px] text-[#111827] shadow-none placeholder:text-[12px] placeholder:text-[#9ca3af] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"

const tableRowDateInputClassName =
  tableRowInputClassName +
  " px-0 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [&::-webkit-calendar-picker-indicator]:w-0 [&::-webkit-calendar-picker-indicator]:p-0 [&::-webkit-datetime-edit]:w-full [&::-webkit-datetime-edit]:text-[12px] [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit-fields-wrapper]:w-full [&::-webkit-datetime-edit-fields-wrapper]:justify-center [&::-webkit-date-and-time-value]:text-[12px] [&::-webkit-date-and-time-value]:text-center [&::-moz-calendar-picker-indicator]:hidden [color-scheme:light]"

function parseIsoDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  const date = new Date(year, monthIndex, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function isHolidayDateInFuture(isoYmd: string): boolean {
  const d = parseIsoDate(isoYmd.trim())
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const holidayDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return holidayDay.getTime() > today.getTime()
}

export type FiscalYearTableProps = {
  control: Control<SettingsFormValues>
  fields: FieldArrayWithId<SettingsFormValues, "fiscalYear.holidays", "id">[]
  onEditRow: (index: number) => void
  onRemoveRow: (index: number) => void
}

function HolidayTableColGroup({ withScrollbarPad }: { withScrollbarPad: boolean }) {
  return (
    <colgroup>
      <col style={{ width: 230 }} />
      <col />
      <col style={{ width: 100 }} />
      <col style={{ width: 120 }} />
      {withScrollbarPad ? <col style={{ width: HOLIDAY_TABLE_SCROLLBAR_PAD_PX }} /> : null}
    </colgroup>
  )
}

export function FiscalYearTable({ control, fields, onEditRow, onRemoveRow }: FiscalYearTableProps) {
  const holidayRows = useWatch({ control, name: "fiscalYear.holidays" })

  const bodyScrollStyle: CSSProperties = {
    maxHeight: holidayTableBodyScrollMaxHeight,
    ...(fields.length === 0 ? { minHeight: holidayTableBodyScrollMaxHeight } : {}),
  }

  const bodyRows = (
    <>
      {fields.length === 0 ? (
        <TableRow className={`${holidayTableBodyRowClassName} border-b border-[#e9ecf3] hover:bg-white`}>
          <TableCell colSpan={4} className="text-center text-[12px] text-[#6b7280]">
            No holidays added
          </TableCell>
        </TableRow>
      ) : (
        fields.map((field, index) => {
          const rowDate = String(holidayRows?.[index]?.date ?? "")
          const showHolidayActions = isHolidayDateInFuture(rowDate)
          return (
            <TableRow
              key={field.id}
              className={`${holidayTableBodyRowClassName} border-b border-[#e9ecf3] hover:bg-white`}
            >
              <TableCell className="border-r border-[#eceff5] py-1 text-center align-middle">
                <Controller
                  name={`fiscalYear.holidays.${index}.date`}
                  control={control}
                  render={({ field: f }) => <Input {...f} type="date" className={tableRowDateInputClassName} />}
                />
              </TableCell>
              <TableCell className="border-r border-[#eceff5] py-1 text-center align-middle">
                <Controller
                  name={`fiscalYear.holidays.${index}.holiday`}
                  control={control}
                  render={({ field: f }) => (
                    <Input {...f} placeholder="Holiday name" className={tableRowInputClassName} />
                  )}
                />
              </TableCell>
              <TableCell className="border-r border-[#eceff5] py-1 text-center align-middle">
                <Controller
                  name={`fiscalYear.holidays.${index}.optional`}
                  control={control}
                  render={({ field: f }) => {
                    const isOptional = Boolean(f.value)
                    return (
                      <span
                        className="inline-flex size-7 items-center justify-center"
                        aria-label={isOptional ? "Optional" : "Not optional"}
                      >
                        <img
                          src={isOptional ? tableCheckIcon : tableCloseIcon}
                          alt=""
                          className="size-3.5 object-contain"
                          aria-hidden
                        />
                      </span>
                    )
                  }}
                />
              </TableCell>
              <TableCell className="py-1 text-center align-middle">
                {showHolidayActions ? (
                  <div className="flex items-center justify-center gap-0">
                    <button
                      type="button"
                      onClick={() => onEditRow(index)}
                      className="inline-flex h-7 cursor-pointer items-center justify-center rounded-[6px] p-0"
                      aria-label="Edit holiday row"
                    >
                      <img src={tableEditIcon} alt="Edit row" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveRow(index)}
                      className="inline-flex h-7 cursor-pointer items-center justify-center rounded-[6px] p-0 text-red-600"
                      aria-label="Delete holiday row"
                    >
                      <Trash2 className="size-3.5 stroke-[1.75]" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          )
        })
      )}
    </>
  )

  return (
    <div className="mt-3 overflow-hidden rounded-[6px] border border-[#e7e9f2] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] table-fixed">
          <HolidayTableColGroup withScrollbarPad />
          <TableHeader className="bg-[var(--primary)] [&_tr]:border-b">
            <TableRow className="border-0 hover:bg-[var(--primary)]">
              <TableHead
                className={`${holidayTableHeadClassName} rounded-tl-[6px] border-r border-white/25 text-center text-[12px] font-medium text-white`}
              >
                Date
              </TableHead>
              <TableHead
                className={`${holidayTableHeadClassName} border-r border-white/25 text-center text-[12px] font-medium text-white`}
              >
                Holiday
              </TableHead>
              <TableHead
                className={`${holidayTableHeadClassName} border-r border-white/25 text-center text-[12px] font-medium text-white`}
              >
                Optional
              </TableHead>
              <TableHead
                className={`${holidayTableHeadClassName} border-r border-white/25 text-center text-[12px] font-medium text-white`}
              >
                Action
              </TableHead>
              <TableHead
                className={`${holidayTableHeadClassName} border-0 p-0 !bg-[var(--primary)] rounded-tr-[6px]`}
                style={{ width: HOLIDAY_TABLE_SCROLLBAR_PAD_PX, minWidth: HOLIDAY_TABLE_SCROLLBAR_PAD_PX, maxWidth: HOLIDAY_TABLE_SCROLLBAR_PAD_PX }}
                aria-hidden
              />
            </TableRow>
          </TableHeader>
        </table>

        <div
          className="min-h-0 overflow-y-scroll border-t border-[#e7e9f2]"
          style={bodyScrollStyle}
        >
          <table className="w-full border-collapse text-[12px] table-fixed">
            <HolidayTableColGroup withScrollbarPad={false} />
            <TableBody className="bg-white">{bodyRows}</TableBody>
          </table>
        </div>
      </div>
    </div>
  )
}
