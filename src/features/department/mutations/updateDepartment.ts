import { useMutation } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { Department, DepartmentUpsertValues } from "../types"
import { updateDepartment as updateDepartmentApi } from "../api/departments"
import { queryClient } from "@/main"
import { mergeDepartmentDetail } from "../lib/mergeDepartmentDetail"

export function useUpdateDepartment() {
  return useMutation({
    mutationFn: (payload: { id: string; values: DepartmentUpsertValues }) =>
      updateDepartmentApi(payload.id, payload.values),
    onSuccess: async (fresh, payload) => {
      const prev = queryClient.getQueryData<Department>(departmentKeys.detail(payload.id))
      const merged = mergeDepartmentDetail(prev, fresh)
      queryClient.setQueryData(departmentKeys.detail(payload.id), merged)
      await queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    },
  })
}
