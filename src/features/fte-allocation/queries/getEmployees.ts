import { useQuery } from "@tanstack/react-query"

import { fteAllocationKeys } from "../keys"
import type { Employee } from "../types"

const MOCK_EMPLOYEES: Employee[] = [
  { id: "emp-01", name: "Abernethy Sue", active: true },
  { id: "emp-02", name: "Altheide Treasure", active: true },
  { id: "emp-03", name: "Andrews Katie", active: true },
  { id: "emp-04", name: "Ankrom Hannah", active: true },
  { id: "emp-05", name: "Arellano Lorena", active: true },
  { id: "emp-06", name: "Arndt Amy", active: true },
  { id: "emp-07", name: "Best Nicole", active: true },
  { id: "emp-08", name: "Boyea Annie", active: true },
  { id: "emp-09", name: "Britt Laurie", active: true },
  { id: "emp-10", name: "Brunner Amanda", active: true },
  { id: "emp-11", name: "Budesilich Jessica", active: true },
  { id: "emp-12", name: "C R Subsmitha", active: false },
  { id: "emp-13", name: "Carter Michael", active: true },
  { id: "emp-14", name: "Davis Rachel", active: true },
  { id: "emp-15", name: "Evans Thomas", active: false },
  { id: "emp-16", name: "Foster Linda", active: true },
  { id: "emp-17", name: "Green Patricia", active: true },
  { id: "emp-18", name: "Harris James", active: true },
  { id: "emp-19", name: "Jackson Barbara", active: true },
  { id: "emp-20", name: "King William", active: false },
]

// In-memory store so mutations persist between re-renders
let employeeStore: Employee[] = [...MOCK_EMPLOYEES]

export function getEmployeeStore() {
  return employeeStore
}

async function fetchEmployees(_fiscalYearId: string): Promise<Employee[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return employeeStore
}

export function useGetEmployees(fiscalYearId: string) {
  return useQuery({
    queryKey: fteAllocationKeys.employees(fiscalYearId),
    queryFn: () => fetchEmployees(fiscalYearId),
    enabled: !!fiscalYearId,
  })
}
