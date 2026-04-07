import { useQuery, type QueryClient } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import { getDepartmentById } from "../api/departments"
import type { Department } from "../types"
import { mergeDepartmentDetail } from "../lib/mergeDepartmentDetail"
import { queryClient } from "@/main"

/** List query may cache `Department[]` (legacy) or `{ items: Department[]; total: number }` (paginated API). */
function rowsFromListQueryData(data: unknown): Department[] {
  if (Array.isArray(data)) return data as Department[]
  if (data !== null && typeof data === "object" && "items" in data) {
    const items = (data as { items: unknown }).items
    if (Array.isArray(items)) return items as Department[]
  }
  return []
}

function getDepartmentFromListCache(
  queryClient: QueryClient,
  id: string
): Department | undefined {
  // Dept list query keys are not a single stable key (status/filters are appended),
  // so scan all cached queries under `departmentKeys.lists()` and find the row.
  const queries = queryClient.getQueryCache().findAll({ queryKey: departmentKeys.lists() })
  for (const q of queries) {
    const rows = rowsFromListQueryData(q.state.data)
    const hit = rows.find((d) => String(d.id) === String(id))
    if (hit) return hit
  }
  return undefined
}

/** Merge list-cache row into GET-by-id: list includes address; by-id may omit it or return it depending on API. */
export async function loadDepartmentDetailForModal(
  queryClient: QueryClient,
  id: string
): Promise<Department> {
  const fresh = await getDepartmentById(id)
  const fromList = getDepartmentFromListCache(queryClient, id)
  const merged = mergeDepartmentDetail(fromList, fresh)
  const prev = queryClient.getQueryData<Department>(departmentKeys.detail(id))
  return mergeDepartmentDetail(prev, merged)
}

export function useGetDepartmentById(id: string | null) {
  return useQuery({
    queryKey: id ? departmentKeys.detail(id) : departmentKeys.details(),
    queryFn: async () => {
      if (!id) throw new Error("Department id is required")
      return loadDepartmentDetailForModal(queryClient, id)
    },
    enabled: !!id,
    // Avoid duplicate GETs: same key was previously prefetched + forced refetch on every mount.
    staleTime: 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

