import { useQuery, type QueryClient } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import { getDepartmentById } from "../api/departments"
import type { Department } from "../types"
import { mergeDepartmentDetail } from "../lib/mergeDepartmentDetail"
import { queryClient } from "@/main"

function getDepartmentFromListCache(
  queryClient: QueryClient,
  id: string
): Department | undefined {
  const rows = queryClient.getQueryData<Department[]>(departmentKeys.lists())
  return rows?.find((d) => String(d.id) === String(id))
}

/** GET-by-id omits `address` in mapping; merge list row so edit form still has address. */
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
    // When opening the Edit modal, always hit the backend
    // so the form reflects the latest DB state.
    staleTime: 0,
    refetchOnMount: "always",
  })
}

