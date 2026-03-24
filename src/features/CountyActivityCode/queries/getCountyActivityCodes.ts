import { useQuery } from "@tanstack/react-query"

import { countyActivityCodeKeys } from "../keys"
import type { CountyActivityCodeRow } from "../types"

const LONG_DESCRIPTION_TEXT =
  "This function code is to be used by all staff to record usage of paid leave, holiday, vacation, sick leave or any paid leave other than CTO. This is an allocated function code. Time recorded under this function code will be prorated amongst all programs (BIH, MCAH, AFLP etc.) included in the time study and matched and unmatched function codes. CMS permits the matchable amount to be proportionately distributed between Enhanced and Non-Enhanced rates."

const BASE_ROWS: Omit<CountyActivityCodeRow, "id">[] = [
  {
    countyActivityCode: "FFP-1",
    countyActivityName: "Outreach",
    description: LONG_DESCRIPTION_TEXT,
    department: "",
    masterCodeType: "FFP",
    masterCode: 1,
    spmp: false,
    match: "N",
    percentage: 0,
    active: true,
    leaveCode: false,
    multipleJobPools: true,
  },
  {
    countyActivityCode: "FFP-10",
    countyActivityName: "Non-Program Specific General Administration",
    description: LONG_DESCRIPTION_TEXT,
    department: "",
    masterCodeType: "FFP",
    masterCode: 10,
    spmp: false,
    match: "N",
    percentage: 0,
    active: true,
    leaveCode: false,
    multipleJobPools: true,
  },
  {
    countyActivityCode: "FFP-11",
    countyActivityName: "Other Activities",
    description: "This function cod...",
    department: "",
    masterCodeType: "FFP",
    masterCode: 11,
    spmp: false,
    match: "N/M",
    percentage: 0,
    active: true,
    leaveCode: false,
    multipleJobPools: true,
  },
  {
    countyActivityCode: "FFP-12",
    countyActivityName: "Paid Time Off",
    description: "This function cod...",
    department: "",
    masterCodeType: "FFP",
    masterCode: 12,
    spmp: false,
    match: "E/N",
    percentage: 0,
    active: true,
    leaveCode: true,
    multipleJobPools: true,
  },
  {
    countyActivityCode: "FFP-2",
    countyActivityName: "SPMP Administrative Medical Case Management",
    description: "This function cod...",
    department: "",
    masterCodeType: "FFP",
    masterCode: 2,
    spmp: true,
    match: "E",
    percentage: 0,
    active: true,
    leaveCode: false,
    multipleJobPools: true,
  },
]

function buildMockRows(): CountyActivityCodeRow[] {
  const rows = [...BASE_ROWS]
  for (let i = 3; i <= 58; i += 1) {
    rows.push({
      countyActivityCode: `FFP-${i + 12}`,
      countyActivityName: `Sample County Activity ${i}`,
      description: i % 4 === 0 ? "Unpaid Time off" : "This function cod...",
      department: "",
      masterCodeType: "FFP",
      masterCode: i + 12,
      spmp: i % 3 === 0,
      match: i % 5 === 0 ? "E" : "N",
      percentage: 0,
      active: true,
      leaveCode: i % 4 === 0,
      multipleJobPools: true,
    })
  }

  return rows.slice(0, 61).map((row, index) => ({
    id: `county-activity-${index + 1}`,
    ...row,
  }))
}

const MOCK_ROWS = buildMockRows()

async function fetchCountyActivityCodes(): Promise<CountyActivityCodeRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return MOCK_ROWS
}

export function useGetCountyActivityCodes() {
  return useQuery({
    queryKey: countyActivityCodeKeys.lists(),
    queryFn: fetchCountyActivityCodes,
  })
}
