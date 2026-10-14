import { useState } from "react"

import { cn } from "@/lib/utils"
import type { ExcelPreviewRow, ExcelPreviewSheet } from "../utils/parseExcelWorkbookPreview"

type ExcelWorkbookPreviewProps = {
  sheets: ExcelPreviewSheet[]
}

const TOTAL_ROW_PATTERN = /(^|\s)(total|grand total|fte by program)\b/i

function isEmptyRow(row: ExcelPreviewRow): boolean {
  return row.cells.every((cell) => !cell || !cell.text.trim())
}

/** A row whose only content is one merged/full-width label (titles, period, notes). */
function isBannerRow(row: ExcelPreviewRow, columnCount: number): boolean {
  const first = row.cells[0]
  if (!first) return false
  return columnCount > 1 && first.colSpan >= columnCount
}

function isHeaderRow(row: ExcelPreviewRow): boolean {
  const label = row.cells[0]?.text.trim()
  return label === "Employee"
}

function isSectionRow(row: ExcelPreviewRow): boolean {
  const [first, ...rest] = row.cells
  if (!first?.text.trim()) return false
  if (first.text.trim() === "Program Name") return true
  return rest.every((cell) => !cell || !cell.text.trim())
}

function isTotalRow(row: ExcelPreviewRow): boolean {
  return TOTAL_ROW_PATTERN.test(row.cells[0]?.text.trim() ?? "")
}

export function ExcelWorkbookPreview({ sheets }: ExcelWorkbookPreviewProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const sheet = sheets[Math.min(activeIndex, sheets.length - 1)]

  if (!sheet) {
    return <p className="p-6 text-[14px] text-[#6b7280]">No data available</p>
  }

  return (
    <div className="flex h-[85vh] min-h-[720px] flex-col">
      {sheets.length > 1 ? (
        <div className="flex shrink-0 gap-1 border-b border-[#E5E7EB] bg-[#F9FAFB] px-3 pt-2" role="tablist">
          {sheets.map((s, index) => (
            <button
              key={s.name}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded-t-[8px] border border-b-0 px-4 py-2 text-[13px] font-medium",
                index === activeIndex
                  ? "border-[#E5E7EB] bg-white text-[#6C5DD3]"
                  : "border-transparent text-[#6b7280] hover:text-[#111827]",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="border-collapse text-[12px] text-[#111827]">
          <tbody>
            {sheet.rows.map((row, rowIndex) => {
              if (isEmptyRow(row)) {
                return (
                  <tr key={rowIndex} aria-hidden>
                    <td colSpan={sheet.columnCount} className="h-3" />
                  </tr>
                )
              }

              if (isBannerRow(row, sheet.columnCount)) {
                const text = row.cells[0]?.text ?? ""
                const isTitle = rowIndex === 0
                return (
                  <tr key={rowIndex}>
                    <td
                      colSpan={sheet.columnCount}
                      className={cn(
                        "sticky left-0 whitespace-nowrap px-3 py-1",
                        isTitle ? "pt-3 text-[16px] font-semibold" : "text-[13px] font-medium",
                        /^employee rows/i.test(text) && "text-[12px] font-normal italic text-[#6b7280]",
                      )}
                    >
                      {text}
                    </td>
                  </tr>
                )
              }

              const header = isHeaderRow(row)
              const total = isTotalRow(row)
              const section = !header && !total && isSectionRow(row)

              return (
                <tr
                  key={rowIndex}
                  className={cn(
                    header && "sticky top-0 z-10 bg-[#D9E2F3] font-semibold",
                    section && "bg-[#F2F2F2] italic",
                    total && "bg-[#E2EFDA] font-semibold",
                  )}
                >
                  {row.cells.map((cell, colIndex) => {
                    if (!cell) return null
                    const Tag = header ? "th" : "td"
                    return (
                      <Tag
                        key={colIndex}
                        colSpan={cell.colSpan}
                        rowSpan={cell.rowSpan}
                        className={cn(
                          "whitespace-nowrap border border-[#D1D5DB] px-2 py-1",
                          colIndex === 0
                            ? "sticky left-0 min-w-[220px] bg-inherit text-left"
                            : "min-w-[110px]",
                          colIndex === 0 && !header && !section && !total && "bg-white",
                          colIndex > 0 && (cell.isNumeric ? "text-right tabular-nums" : header ? "text-center" : "text-left"),
                        )}
                      >
                        {cell.text}
                      </Tag>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
