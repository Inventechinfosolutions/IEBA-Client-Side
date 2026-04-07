export const masterCodeKeys = {
  all: ["master-code"] as const,
  /** All types (FFP, MAA, …) for county grid SPMP / Match / % — cached separately from hierarchy. */
  activityCodesCatalogEnrichment: () =>
    [...masterCodeKeys.all, "activity-codes-catalog-enrichment"] as const,
  /** `GET /activity-codes` without `type` (paged, limit 1000) — shared raw catalog. */
  activityCodesCatalogAll: () =>
    [...masterCodeKeys.all, "activity-codes-catalog-all"] as const,
  lists: () => [...masterCodeKeys.all, "list"] as const,
  list: (params: {
    codeType: string
    page: number
    pageSize: number
    inactiveOnly: boolean
  }) => [...masterCodeKeys.lists(), params] as const,
  /** `GET /master-codes/by-name?name=` — current tab row (id, allowMulticode, …) */
  tenantByName: (name: string) =>
    [...masterCodeKeys.all, "tenant-by-name", name] as const,
  details: () => [...masterCodeKeys.all, "detail"] as const,
  detail: (id: string) => [...masterCodeKeys.details(), id] as const,
}
