import { useQuery, useQueryClient } from "@tanstack/react-query"

import { fteAllocationKeys } from "../keys"
import type { Month, ProgramRow } from "../types"

const buildDefaultMom = (): Record<Month, number> => ({
  Jul: 0,
  Aug: 0,
  Sep: 0,
  Oct: 0,
  Nov: 0,
  Dec: 0,
  Jan: 0,
  Feb: 0,
  Mar: 0,
  Apr: 0,
  May: 0,
  Jun: 0,
})

const MOCK_PROGRAMS: ProgramRow[] = [
  {
    id: "prog-01",
    program: "Public Health",
    budgetedFte: 0.0,
    allocatedFte: 0.0,
    momAllocations: buildDefaultMom(),
  },
  {
    id: "prog-02",
    program: "WIC",
    budgetedFte: 0.0,
    allocatedFte: 0,
    momAllocations: buildDefaultMom(),
  },
  {
    id: "prog-03",
    program: "Social Worker",
    budgetedFte: 0.0,
    allocatedFte: 0.0,
    momAllocations: buildDefaultMom(),
  },
  {
    id: "prog-04",
    program: "Employment",
    budgetedFte: 0.0,
    allocatedFte: 0.0,
    momAllocations: buildDefaultMom(),
  },
  {
    id: "prog-05",
    program: "Eligibility",
    budgetedFte: 0.0,
    allocatedFte: 0.0,
    momAllocations: buildDefaultMom(),
  },
  {
    id: "prog-06",
    program: "CalWORKs",
    budgetedFte: 0.0,
    allocatedFte: 0.0,
    momAllocations: buildDefaultMom(),
  },
]

// In-memory store keyed by "fiscalYearId__employeeId"
const programStore = new Map<string, ProgramRow[]>()

function storeKey(fiscalYearId: string, employeeId: string) {
  return `${fiscalYearId}__${employeeId}`
}

export function getProgramsForEmployee(
  fiscalYearId: string,
  employeeId: string
): ProgramRow[] {
  const key = storeKey(fiscalYearId, employeeId)
  if (!programStore.has(key)) {
    programStore.set(
      key,
      MOCK_PROGRAMS.map((p) => ({
        ...p,
        momAllocations: buildDefaultMom(),
        allocatedFte: 0.0,
      }))
    )
  }
  return programStore.get(key)!
}

export function updateProgramMom(
  fiscalYearId: string,
  employeeId: string,
  programId: string,
  month: Month,
  value: number
) {
  const key = storeKey(fiscalYearId, employeeId)
  const rows = getProgramsForEmployee(fiscalYearId, employeeId)
  programStore.set(
    key,
    rows.map((row) => {
      if (row.id !== programId) return row
      const newMom = { ...row.momAllocations, [month]: value }
      const allocatedFte = Object.values(newMom).reduce(
        (sum, v) => sum + v,
        0
      )
      return { ...row, momAllocations: newMom, allocatedFte }
    })
  )
}

async function fetchPrograms(
  fiscalYearId: string,
  employeeId: string
): Promise<ProgramRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return getProgramsForEmployee(fiscalYearId, employeeId)
}

export function useGetPrograms(
  fiscalYearId: string,
  employeeId: string | null
) {
  return useQuery({
    queryKey: fteAllocationKeys.programs(
      fiscalYearId,
      employeeId ?? undefined
    ),
    queryFn: () => fetchPrograms(fiscalYearId, employeeId!),
    enabled: !!fiscalYearId && !!employeeId,
  })
}

/** Helper hook: returns an invalidation function so callers can refresh. */
export function useInvalidatePrograms() {
  const queryClient = useQueryClient()
  return (fiscalYearId: string, employeeId: string) =>
    queryClient.invalidateQueries({
      queryKey: fteAllocationKeys.programs(fiscalYearId, employeeId),
    })
}
