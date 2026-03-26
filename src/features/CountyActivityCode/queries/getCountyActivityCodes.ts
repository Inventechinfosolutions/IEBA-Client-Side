import { useQuery } from "@tanstack/react-query"

import { countyActivityCodeKeys } from "../keys"
import type { CountyActivityCodeRow } from "../types"

export const COUNTY_ACTIVITY_CODE_TYPE_OPTIONS = [
  "CDSS",
  "FFP",
  "INTERNAL",
  "MAA",
  "TCM",
] as const

export const COUNTY_ACTIVITY_MASTER_CODE_OPTIONS = [
  { label: "1 * Outreach", value: 1 },
  { label: "2 * SPMP Administrative Medical Case Management", value: 2 },
  { label: "3 * SPMP Intra/Interagency Coordination", value: 3 },
  { label: "4 * Non-SPMP Intra/Interagency Collaboration", value: 4 },
  { label: "5 * Program Specific Administration", value: 5 },
  { label: "6 * SPMP Training", value: 6 },
  { label: "7 * Non-SPMP Training", value: 7 },
  { label: "8 * SPMP Program Planning and Policy Development", value: 8 },
  { label: "9 * Quality Management by Skilled Professional", value: 9 },
  { label: "10 * Non-Program Specific General Administration", value: 10 },
  { label: "11 * Other Activities", value: 11 },
  { label: "12 * Paid Time Off", value: 12 },
] as const

export const COUNTY_ACTIVITY_DUMMY_DEPARTMENTS = [
  "Social Services",
  "Behavioral Health",
  "Public Health",
  "Child Support Services",
  "Aging & Adult Services",
  "Human Resources",
  "Finance",
] as const

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
    rowType: "primary",
    parentId: null,
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
    rowType: "primary",
    parentId: null,
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
    rowType: "primary",
    parentId: null,
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
    rowType: "primary",
    parentId: null,
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
    rowType: "primary",
    parentId: null,
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
      rowType: "primary",
      parentId: null,
    })
  }

  const primaries = rows.slice(0, 61).map((row, index) => ({
    id: `county-activity-${index + 1}`,
    ...row,
  }))

  // Add a few secondary rows under a primary to demo expand/collapse behavior.
  const parent = primaries.find((r) => r.masterCode === 31) ?? primaries[0]
  const secondaryRows: CountyActivityCodeRow[] = [
    {
      id: "county-activity-sub-1",
      countyActivityCode: "SEC-001",
      countyActivityName: "Secondary Activity A",
      description: "Secondary activity under selected primary",
      department: "",
      masterCodeType: parent.masterCodeType,
      masterCode: parent.masterCode,
      spmp: false,
      match: "N",
      percentage: 0,
      active: true,
      leaveCode: false,
      multipleJobPools: false,
      rowType: "sub",
      parentId: parent.id,
    },
    {
      id: "county-activity-sub-2",
      countyActivityCode: "SEC-002",
      countyActivityName: "Secondary Activity B",
      description: "Another secondary activity under selected primary",
      department: "",
      masterCodeType: parent.masterCodeType,
      masterCode: parent.masterCode,
      spmp: false,
      match: "N",
      percentage: 0,
      active: true,
      leaveCode: false,
      multipleJobPools: false,
      rowType: "sub",
      parentId: parent.id,
    },
  ]

  return [...primaries, ...secondaryRows]
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
