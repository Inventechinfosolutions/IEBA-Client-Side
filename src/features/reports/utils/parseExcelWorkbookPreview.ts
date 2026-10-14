import { read, utils, type CellObject, type WorkSheet } from "xlsx"

export type ExcelPreviewCell = {
  text: string
  isNumeric: boolean
  colSpan: number
  rowSpan: number
}

export type ExcelPreviewRow = {
  /** `null` entries are covered by a merged cell from an earlier row/column. */
  cells: Array<ExcelPreviewCell | null>
}

export type ExcelPreviewSheet = {
  name: string
  columnCount: number
  rows: ExcelPreviewRow[]
}

function cellText(cell: CellObject | undefined): string {
  if (!cell) return ""
  if (cell.w != null) return String(cell.w)
  if (cell.v == null) return ""
  return String(cell.v)
}

function parseSheet(name: string, ws: WorkSheet): ExcelPreviewSheet {
  const ref = ws["!ref"]
  if (!ref) return { name, columnCount: 0, rows: [] }

  const range = utils.decode_range(ref)
  const columnCount = range.e.c - range.s.c + 1

  const spanByAnchor = new Map<string, { colSpan: number; rowSpan: number }>()
  const covered = new Set<string>()
  for (const merge of ws["!merges"] ?? []) {
    spanByAnchor.set(`${merge.s.r}:${merge.s.c}`, {
      colSpan: merge.e.c - merge.s.c + 1,
      rowSpan: merge.e.r - merge.s.r + 1,
    })
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      for (let c = merge.s.c; c <= merge.e.c; c++) {
        if (r !== merge.s.r || c !== merge.s.c) covered.add(`${r}:${c}`)
      }
    }
  }

  const rows: ExcelPreviewRow[] = []
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cells: Array<ExcelPreviewCell | null> = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const key = `${r}:${c}`
      if (covered.has(key)) {
        cells.push(null)
        continue
      }
      const cell = ws[utils.encode_cell({ r, c })] as CellObject | undefined
      const span = spanByAnchor.get(key)
      cells.push({
        text: cellText(cell),
        isNumeric: cell?.t === "n",
        colSpan: span?.colSpan ?? 1,
        rowSpan: span?.rowSpan ?? 1,
      })
    }
    rows.push({ cells })
  }

  return { name, columnCount, rows }
}

/** Reads an `.xlsx` blob into display-ready sheets (formatted cell text + merges). */
export async function parseExcelWorkbookPreview(blob: Blob): Promise<ExcelPreviewSheet[]> {
  const buffer = await blob.arrayBuffer()
  const workbook = read(buffer, { type: "array" })
  return workbook.SheetNames.map((sheetName) => parseSheet(sheetName, workbook.Sheets[sheetName]))
}
