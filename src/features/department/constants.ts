import type { GetDepartmentsParams } from "@/features/department/types"

/** Shared params for active department dropdowns (Settings → Reports, Reports screen, etc.). */
export const ACTIVE_DEPARTMENTS_PAGE_PARAMS = {
  status: "active",
  page: 1,
  limit: 100,
} satisfies GetDepartmentsParams
