export const masterCodeKeys = {
  all: ["master-code"] as const,
  lists: () => [...masterCodeKeys.all, "list"] as const,
  list: (params: {
    codeType: string
    page: number
    pageSize: number
    inactiveOnly: boolean
  }) => [...masterCodeKeys.lists(), params] as const,
  /** `GET /master-codes` — tab labels + allowMulticode */
  tenantMasterCodes: () => [...masterCodeKeys.all, "tenant-master-codes"] as const,
  details: () => [...masterCodeKeys.all, "detail"] as const,
  detail: (id: string) => [...masterCodeKeys.details(), id] as const,
}
