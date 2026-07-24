export function getRolePriorityWeight(roleName: string): number {
  const normalized = (roleName ?? "").toLowerCase().replace(/[^a-z]/g, "")
  if (normalized.includes("superadmin")) return 100
  if (normalized.includes("deptadmin") || normalized.includes("departmentadmin")) return 80
  if (normalized.includes("timestudysupervisor") || normalized.includes("supervisor")) return 60
  if (normalized.includes("payroll")) return 40
  return 10
}

export function getHighestPriorityDeptRole<T extends { roleName: string }>(
  deptRoles: T[] | undefined | null
): T | undefined {
  if (!deptRoles || deptRoles.length === 0) return undefined
  return [...deptRoles].sort(
    (a, b) => getRolePriorityWeight(b.roleName) - getRolePriorityWeight(a.roleName)
  )[0]
}
