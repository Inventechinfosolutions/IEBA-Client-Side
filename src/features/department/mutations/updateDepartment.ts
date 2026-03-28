import { useMutation, useQueryClient } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import { MOCK_DEPARTMENTS } from "../queries/getDepartments"
import type { Department } from "../types"

async function updateDepartment(updatedDept: Department): Promise<Department> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = MOCK_DEPARTMENTS.findIndex((d) => d.id === updatedDept.id)
  if (index !== -1) {
    MOCK_DEPARTMENTS[index] = updatedDept
  }
  return updatedDept
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(data.id) })
    },
  })
}
