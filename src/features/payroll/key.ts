import type { GetPayrollRowsParams } from "./types"

export const payrollKeys = {
  all: ["payroll"] as const,
  lists: () => [...payrollKeys.all, "list"] as const,
  filterOptions: () => [...payrollKeys.lists(), "filter-options"] as const,
  departmentUsers: (deptId: string, fiscalYearId: string) => 
    [...payrollKeys.lists(), "department-users", { deptId, fiscalYearId }] as const,
  rowsIdle: () => [...payrollKeys.lists(), "rows", "idle"] as const,
  rows: (params: GetPayrollRowsParams) => [...payrollKeys.lists(), "rows", params] as const,
}
