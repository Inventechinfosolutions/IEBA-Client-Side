import { useMutation, useQueryClient } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { DepartmentUpsertValues } from "../types"
import { createDepartment } from "../api/departments"

export function useAddDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: DepartmentUpsertValues) => createDepartment(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
