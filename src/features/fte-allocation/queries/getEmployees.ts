import { useQuery } from "@tanstack/react-query"

import { fteAllocationKeys } from "../keys"
import type { Employee } from "../types"

import { apiGetUserModuleRows } from "@/features/user/api"

async function fetchEmployees(includeInactive: boolean): Promise<Employee[]> {
  const active = await apiGetUserModuleRows({
    page: 1,
    pageSize: 100,
    inactiveOnly: false,
    sort: "ASC",
  })
  const activeRows: Employee[] = active.items.map((u) => ({
    id: u.id,
    name: (u.employee ?? "").trim() || (u.loginId ?? "").trim() || u.id,
    active: true,
  }))

  if (!includeInactive) return activeRows

  const inactive = await apiGetUserModuleRows({
    page: 1,
    pageSize: 100,
    inactiveOnly: true,
    sort: "ASC",
  })
  const inactiveRows: Employee[] = inactive.items.map((u) => ({
    id: u.id,
    name: (u.employee ?? "").trim() || (u.loginId ?? "").trim() || u.id,
    active: false,
  }))

  const dedupe = new Map<string, Employee>()
  for (const r of [...activeRows, ...inactiveRows]) dedupe.set(r.id, r)
  return [...dedupe.values()].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  )
}

export function useGetEmployees(fiscalYearId: string, includeInactive: boolean) {
  return useQuery({
    queryKey: fteAllocationKeys.employees({ fiscalYearId, includeInactive }),
    queryFn: () => fetchEmployees(includeInactive),
    enabled: !!fiscalYearId,
  })
}
