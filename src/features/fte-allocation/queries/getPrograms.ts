import { useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { ApiResponseDto } from "@/features/user/types"

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

type UserBudgetProgramApiRow = {
  id: number
  budgetedfte?: string | number | null
  allocatedfte?: string | number | null
  name: string
  code: string | null
}

function parseFte(s: unknown): number {
  const n = typeof s === "number" ? s : typeof s === "string" ? Number(s) : NaN
  return Number.isFinite(n) ? n : 0
}

async function fetchPrograms(
  fiscalYearId: string,
  employeeId: string
): Promise<ProgramRow[]> {
  const search = new URLSearchParams()
  search.set("method", "getuserbudgetprograms")
  search.set("fiscalyear", fiscalYearId)
  const res = await api.get<ApiResponseDto<unknown>>(
    `/userprogramassignment/user/${encodeURIComponent(employeeId)}?${search.toString()}`
  )
  if (!res?.success) {
    throw new Error(res?.message ?? "Failed to load programs")
  }
  let assignedPrograms: unknown[] = []
  if (res.data && typeof res.data === "object" && "assignedPrograms" in res.data) {
    const dataObj = res.data as { assignedPrograms?: unknown }
    if (Array.isArray(dataObj.assignedPrograms)) {
      assignedPrograms = dataObj.assignedPrograms
    }
  }
  const out: ProgramRow[] = []
  for (const raw of assignedPrograms) {
    if (raw === null || typeof raw !== "object") continue
    const r = raw as Partial<UserBudgetProgramApiRow>
    const id = typeof r.id === "number" ? String(r.id) : ""
    const program = typeof r.name === "string" ? r.name.trim() : ""
    if (!id || !program) continue
    out.push({
      id,
      program,
      budgetedFte: parseFte(r.budgetedfte),
      allocatedFte: parseFte(r.allocatedfte),
      momAllocations: buildDefaultMom(),
    })
  }
  return out
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
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
