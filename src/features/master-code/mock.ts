import type { MasterCodeRow } from "./types"

export const MOCK_NETWORK_DELAY_MS = 500
export const DEFAULT_ACTIVITY_DESCRIPTION =
  "This function code is to be used by all staff (SPMP and Non-SPMP) when performing activities that inform Medi-Cal eligible or potentially eligible individuals, as well as other clients, about health services covered by Medi-Cal and how to access the health programs."

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const mockMasterCodeRows: MasterCodeRow[] = [
  { id: "1", code: "1", name: "Outreach", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "2", code: "2", name: "SPMP Administrative Medical Case Management", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "3", code: "3", name: "SPMP Intra/Interagency Coordination, Collaboration and Administration", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "4", code: "4", name: "Non-SPMP Intra/Interagency Collaboration and Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "5", code: "5", name: "Program Specific Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "6", code: "6", name: "SPMP Training", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "7", code: "7", name: "Non-SPMP Training", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "8", code: "8", name: "SPMP Program Planning and Policy Development", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "9", code: "9", name: "Quality Management by Skilled Professional Medical Personnel", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "10", code: "10", name: "Non-Program Specific General Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "11", code: "11", name: "Program Outreach Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "12", code: "12", name: "Clinical Services Documentation", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "13", code: "13", name: "Interagency Policy Communication", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "14", code: "14", name: "Community Program Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "15", code: "15", name: "Administrative Planning Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "16", code: "16", name: "SPMP Compliance Training", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "17", code: "17", name: "Non-SPMP Program Training", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "18", code: "18", name: "Program Quality Review", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "19", code: "19", name: "Case Coordination Services", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "20", code: "20", name: "General Operations Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "21", code: "21", name: "Member Communication Services", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "22", code: "22", name: "SPMP Program Monitoring", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "23", code: "23", name: "Provider Liaison Support", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "24", code: "24", name: "Operational Coordination", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "25", code: "25", name: "Program Metrics Reporting", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "26", code: "26", name: "SPMP Standards Review", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "27", code: "27", name: "Non-SPMP Workflow Support", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
  { id: "28", code: "28", name: "Program Policy Analysis", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "29", code: "29", name: "Quality Assurance Activities", spmp: true, allocable: true, ffpPercent: "0.00", match: "E", status: true },
  { id: "30", code: "30", name: "Cross-Program Administration", spmp: false, allocable: true, ffpPercent: "0.00", match: "N", status: true },
]

export function filterRows(rows: MasterCodeRow[], inactiveOnly: boolean): MasterCodeRow[] {
  if (inactiveOnly) {
    return rows.filter((row) => !row.status)
  }

  return rows
}
