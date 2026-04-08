import type { PayrollManagementRow } from "../types"

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function rowToCsvCells(row: PayrollManagementRow): string[] {
  return [
    row.employeeId,
    row.employeeLastName,
    row.employeeFirstName,
    row.employeeMiddleName,
    row.suffix,
    row.department,
    row.bargainingUnit,
    row.type,
    row.position,
    row.payPeriodBegin,
    row.payPeriodEnd,
    row.checkDate,
    row.fica,
    row.pers,
    row.defComp,
    row.cafeteria,
    row.lifeInsurance,
    row.standby,
    row.spa,
    row.cellStipend,
    row.std,
    row.ot,
    row.recruitingIncentive,
    row.cashOut,
    row.payout,
    row.salary,
  ].map(escapeCsvCell)
}

export function buildPayrollRowsCsvContent(
  headers: readonly string[],
  rows: readonly PayrollManagementRow[],
): string {
  const headerLine = headers.map(escapeCsvCell).join(",")
  const lines = rows.map((r) => rowToCsvCells(r).join(","))
  return [headerLine, ...lines].join("\n")
}

export function triggerBrowserDownloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  triggerBrowserDownloadBlob(filename, blob)
}

export function triggerBrowserDownloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.rel = "noopener"
  anchor.click()
  URL.revokeObjectURL(url)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function computeHeaderColumnWidths(headers: readonly string[]): number[] {
  // Approximate “auto-fit” based on header length.
  return headers.map((h) => clamp(h.length + 2, 10, 34))
}

export async function buildPayrollTemplateXlsxBlob(headers: readonly string[]): Promise<Blob> {
  // Use SheetJS for browser-friendly .xlsx generation.
  // Lazy-load so Excel generation doesn’t affect initial bundle.
  const mod = await import("xlsx")
  const XLSX = mod.default ?? mod

  const widths = computeHeaderColumnWidths(headers)

  const ws = XLSX.utils.aoa_to_sheet([Array.from(headers)])
  ;(ws as unknown as { ["!cols"]?: Array<{ wch: number }> })["!cols"] = widths.map((wch) => ({ wch }))

  // Freeze header row (row 1). SheetJS supports this via workbook view (not sheet metadata).
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Payroll Template")
  ;(wb as unknown as { Workbook?: { Views?: Array<Record<string, unknown>> } }).Workbook = {
    Views: [{ RTL: false, activeTab: 0 }],
  }

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
  return new Blob([out], { type: XLSX_MIME })
}
