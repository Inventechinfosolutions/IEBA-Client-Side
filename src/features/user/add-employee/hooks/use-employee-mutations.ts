import { useCreateEmployee } from "../mutations/create-employee"
import { useUpdateEmployee } from "../mutations/update-employee"

export function useEmployeeMutations() {
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  return {
    createEmployee,
    updateEmployee,
  }
}

