import { useMutation, useQueryClient } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import { MOCK_DEPARTMENTS } from "../queries/getDepartments"
import type { Department } from "../types"

async function addDepartment(newDept: Department): Promise<Department> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = MOCK_DEPARTMENTS.findIndex((d) => d.id === newDept.id)
  if (index === -1) {
    MOCK_DEPARTMENTS.unshift(newDept)
  } else {
    MOCK_DEPARTMENTS[index] = newDept
  }
  return newDept
}

export function useAddDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: addDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    },
  })
}
