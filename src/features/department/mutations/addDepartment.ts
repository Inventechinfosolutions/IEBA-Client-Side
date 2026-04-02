import { useMutation } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { DepartmentUpsertValues } from "../types"
import { createDepartment } from "../api/departments"
import { queryClient } from "@/main"

export function useAddDepartment() {
  return useMutation({
    mutationFn: (values: DepartmentUpsertValues) => createDepartment(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all })
    },
  })
}
