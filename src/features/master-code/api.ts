import type { MasterCodeFormValues, MasterCodeRow } from "./types"

export type GetMasterCodesParams = {
  codeType: string
  page: number
  pageSize: number
  inactiveOnly: boolean
}

export type MasterCodeListResponse = {
  items: MasterCodeRow[]
  totalItems: number
}

export type CreateMasterCodeInput = {
  codeType: string
  values: MasterCodeFormValues
}

export type UpdateMasterCodeInput = {
  id: string
  codeType: string
  values: MasterCodeFormValues
}

const MOCK_NETWORK_DELAY_MS = 500

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

let mockMasterCodeRows: MasterCodeRow[] = [
  { id: "1", name: "Outreach", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "2", name: "SPMP Administrative Medical Case Management", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "3", name: "SPMP Intra/Interagency Coordination, Collaboration and Administration", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "4", name: "Non-SPMP Intra/Interagency Collaboration and Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "5", name: "Program Specific Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "6", name: "SPMP Training", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "7", name: "Non-SPMP Training", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "8", name: "SPMP Program Planning and Policy Development", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "9", name: "Quality Management by Skilled Professional Medical Personnel", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "10", name: "Non-Program Specific General Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "11", name: "Program Outreach Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "12", name: "Clinical Services Documentation", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "13", name: "Interagency Policy Communication", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "14", name: "Community Program Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "15", name: "Administrative Planning Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "16", name: "SPMP Compliance Training", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "17", name: "Non-SPMP Program Training", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "18", name: "Program Quality Review", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "19", name: "Case Coordination Services", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "20", name: "General Operations Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "21", name: "Member Communication Services", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "22", name: "SPMP Program Monitoring", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "23", name: "Provider Liaison Support", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "24", name: "Operational Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "25", name: "Program Metrics Reporting", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "26", name: "SPMP Standards Review", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "27", name: "Non-SPMP Workflow Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "28", name: "Program Policy Analysis", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "29", name: "Quality Assurance Activities", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "30", name: "Cross-Program Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
]

function filterRows(rows: MasterCodeRow[], inactiveOnly: boolean): MasterCodeRow[] {
  if (inactiveOnly) {
    return rows.filter((row) => !row.status)
  }
  return rows
}

export async function fetchMasterCodes(
  params: GetMasterCodesParams
): Promise<MasterCodeListResponse> {
  await delay(MOCK_NETWORK_DELAY_MS)
  const filtered = filterRows(mockMasterCodeRows, params.inactiveOnly)
  const start = (params.page - 1) * params.pageSize
  const end = start + params.pageSize
  return {
    items: filtered.slice(start, end),
    totalItems: filtered.length,
  }
}

export async function createMasterCode(
  input: CreateMasterCodeInput
): Promise<MasterCodeRow> {
  await delay(MOCK_NETWORK_DELAY_MS)
  const nextId = String(
    mockMasterCodeRows.reduce((max, row) => Math.max(max, Number.parseInt(row.id, 10) || 0), 0) + 1
  )
  const nextRow: MasterCodeRow = {
    id: nextId,
    name: input.values.name,
    spmp: input.values.spmp,
    allocable: input.values.allocable,
    ffpPercent: input.values.ffpPercent || "0.00",
    match: input.values.match === "E" ? "E" : "N",
    status: input.values.active,
  }
  mockMasterCodeRows = [nextRow, ...mockMasterCodeRows]
  return nextRow
}

export async function updateMasterCode(
  input: UpdateMasterCodeInput
): Promise<MasterCodeRow> {
  await delay(MOCK_NETWORK_DELAY_MS)
  const existing = mockMasterCodeRows.find((row) => row.id === input.id)
  if (!existing) {
    throw new Error("Master code not found")
  }

  const updated: MasterCodeRow = {
    ...existing,
    name: input.values.name,
    spmp: input.values.spmp,
    allocable: input.values.allocable,
    ffpPercent: input.values.ffpPercent || "0.00",
    match: input.values.match === "E" ? "E" : "N",
    status: input.values.active,
  }

  mockMasterCodeRows = mockMasterCodeRows.map((row) =>
    row.id === input.id ? updated : row
  )

  return updated
}
