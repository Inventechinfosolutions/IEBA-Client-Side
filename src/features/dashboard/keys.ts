export const dashboardKeys = {
  all: ["dashboard"] as const,
  reports: () => [...dashboardKeys.all, "reports"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  /** `GET /audit-history` — paginated audit log. */
  auditHistory: (params: { page: number; limit: number; entityName: string }) =>
    [...dashboardKeys.all, "audit-history", params] as const,
}
