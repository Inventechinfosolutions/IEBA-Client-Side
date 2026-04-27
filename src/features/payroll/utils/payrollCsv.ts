import type { PayrollManagementRow } from "../types"

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

function escapeCsvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function rowToCsvCells(row: PayrollManagementRow): string[] {
  return [
    row.employeeId || "",
    row.employeeFirstName || "",
    row.employeeMiddleName || "",
    row.employeeLastName || "",
    row.suffix || "",
    row.department || "",
    row.bargainingUnit || "",
    row.type || "",
    row.position || "",
    row.payPeriodBegin || "",
    row.payPeriodEnd || "",
    row.checkDate || "",
    row.fica || "",
    row.pers || "",
    row.defComp || "",
    row.cafeteria || "",
    row.lifeInsurance || "",
    row.standby || "",
    row.spa || "",
    row.cellStipend || "",
    row.std || "",
    row.ot || "",
    row.recruitingIncentive || "",
    row.cashOut || "",
    row.payout || "",
    row.salary || "",
    row.year || "",
    row.month || "",
    row.payrollType || "",
  ].map((val) => escapeCsvCell(String(val ?? "")))
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



export async function buildPayrollRowsXlsxBlob(
  headers: readonly string[],
  rows: readonly PayrollManagementRow[],
): Promise<Blob> {
  const mod = await import("xlsx")
  const XLSX = mod.default ?? mod

  // 1. Prepare data (AOA format: Header row + Data rows)
  const data = [
    Array.from(headers),
    ...rows.map((r) => rowToCsvCells(r))
  ]

  // 2. Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data)

  // 3. Compute auto-fit column widths
  // Start with header lengths, then check max length in each data column
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length
    for (const row of rows) {
      const cellVal = String(rowToCsvCells(row)[i] || "")
      if (cellVal.length > maxLen) maxLen = cellVal.length
    }
    // Clamp between 12 and 40 characters
    return { wch: Math.max(12, Math.min(40, maxLen + 2)) }
  })

  ws["!cols"] = colWidths

  // 4. Create workbook and package as blob
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Payroll Data")

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
  return new Blob([out], { type: XLSX_MIME })
}
