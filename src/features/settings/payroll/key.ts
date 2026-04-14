export const payrollKeys = {
  all: ["settings", "payroll"] as const,
  detail: () => [...payrollKeys.all, "detail"] as const,
}
