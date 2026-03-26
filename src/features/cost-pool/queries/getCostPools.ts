import { useQuery } from "@tanstack/react-query"

import { costPoolKeys } from "../keys"
import type { CostPoolActivity, CostPoolRow, Department } from "../types"

export const DEPARTMENTS: readonly Department[] = [
  "Public Health",
  "Social Services",
  "Health Services",
  "Administration",
] as const

export const MOCK_ACTIVITIES_BY_DEPARTMENT: Record<Department, CostPoolActivity[]> = {
  "Public Health": [
    { id: "ph-1", name: "(Apportion-01)Internal Apportioning Code" },
    { id: "ph-2", name: "(C0011)County Code - Public Health" },
    { id: "ph-3", name: "(C0012)County Code - Public Health" },
    { id: "ph-4", name: "(C0013)County Code - Public Health" },
    { id: "ph-5", name: "(9000)Non-Allocable" },
  ],
  "Social Services": [
    { id: "ss-1", name: "(Apportion-01)Internal Apportioning Code" },
    { id: "ss-2", name: "(C0011)County Code - Social Worker" },
    { id: "ss-3", name: "(C0121)County Code - Social Worker" },
    { id: "ss-4", name: "(C0133)County Code - Social Worker" },
    { id: "ss-5", name: "(C0141)County Code - Social Worker" },
    { id: "ss-6", name: "(C0151)County Code - Social Worker" },
    { id: "ss-7", name: "(C0161)County Code - Social Worker" },
    { id: "ss-8", name: "(C0171)County Code - Social Worker" },
    { id: "ss-9", name: "(9000)Non-Allocable" },
  ],
  "Health Services": [
    { id: "hs-1", name: "(Apportion-01)Internal Apportioning Code" },
    { id: "hs-2", name: "(C0201)County Code - Health Services" },
    { id: "hs-3", name: "(C0202)County Code - Health Services" },
    { id: "hs-4", name: "(9000)Non-Allocable" },
  ],
  Administration: [
    { id: "adm-1", name: "(Apportion-01)Internal Apportioning Code" },
    { id: "adm-2", name: "(C0301)County Code - Administration" },
    { id: "adm-3", name: "(9000)Non-Allocable" },
  ],
}

const INITIAL_ROWS: CostPoolRow[] = [
  { id: "cost-pool-1", costPool: "Public Health", department: "Public Health", active: true, assignedActivityIds: [] },
  { id: "cost-pool-2", costPool: "WIC", department: "Public Health", active: true, assignedActivityIds: [] },
  { id: "cost-pool-3", costPool: "Social Worker", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-4", costPool: "Employment", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-5", costPool: "Eligibility", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-6", costPool: "CWS CARES", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-7", costPool: "Probation", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-8", costPool: "Fraud", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-9", costPool: "EDP", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-10", costPool: "TAY-THP", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-11", costPool: "Clerical", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-12", costPool: "Mental Health", department: "Health Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-13", costPool: "Child Support", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-14", costPool: "CalWORKs", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-15", costPool: "APS", department: "Social Services", active: true, assignedActivityIds: [] },
  { id: "cost-pool-16", costPool: "Administration", department: "Administration", active: false, assignedActivityIds: [] },
  { id: "cost-pool-17", costPool: "Finance", department: "Administration", active: false, assignedActivityIds: [] },
  { id: "cost-pool-18", costPool: "IT", department: "Administration", active: false, assignedActivityIds: [] },
  { id: "cost-pool-19", costPool: "Facilities", department: "Administration", active: false, assignedActivityIds: [] },
]

let costPoolStore: CostPoolRow[] = [...INITIAL_ROWS]

export function costPoolStoreAdd(row: CostPoolRow) {
  costPoolStore = [row, ...costPoolStore]
}

export function costPoolStoreUpdate(
  id: string,
  patch: Pick<CostPoolRow, "costPool" | "department" | "active" | "assignedActivityIds">
) {
  costPoolStore = costPoolStore.map((row) => (row.id === id ? { ...row, ...patch } : row))
}

async function fetchCostPools(): Promise<CostPoolRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return costPoolStore
}

export function useGetCostPools() {
  return useQuery({
    queryKey: costPoolKeys.lists(),
    queryFn: fetchCostPools,
  })
}

