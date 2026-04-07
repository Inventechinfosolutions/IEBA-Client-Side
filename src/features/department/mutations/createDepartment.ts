import { useMutation } from "@tanstack/react-query"

import { queryClient } from "@/main"
import { createDepartment } from "../api/departments"
import { departmentKeys } from "../keys"
import type { DepartmentUpsertValues } from "../types"

export function useCreateDepartment() {
  return useMutation({
    mutationFn: (values: DepartmentUpsertValues) => createDepartment(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    },
  })
}
