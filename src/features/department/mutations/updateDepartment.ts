import { useMutation } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { DepartmentUpsertValues } from "../types"
import { updateDepartment as updateDepartmentApi } from "../api/departments"
import { queryClient } from "@/main"

export function useUpdateDepartment() {
  return useMutation({
    mutationFn: (payload: { id: string; values: DepartmentUpsertValues }) =>
      updateDepartmentApi(payload.id, payload.values),
    onSuccess: async (_data, payload) => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      await queryClient.invalidateQueries({
        queryKey: departmentKeys.detail(payload.id),
      })
    },
  })
}
