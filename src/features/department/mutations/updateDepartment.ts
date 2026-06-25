import { useMutation } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { Department, DepartmentUpsertValues } from "../types"
import { updateDepartment as updateDepartmentApi } from "../api/departments"
import { queryClient } from "@/main"
import { mergeDepartmentDetail } from "../lib/mergeDepartmentDetail"

export function useUpdateDepartment() {
  return useMutation({
    mutationFn: (payload: {
      id: string
      values: DepartmentUpsertValues
      referenceValues?: DepartmentUpsertValues
      addressChanged?: boolean
    }) => updateDepartmentApi(payload.id, payload.values, payload.referenceValues, payload.addressChanged),
    onSuccess: async (fresh, payload) => {
      const prev = queryClient.getQueryData<Department>(departmentKeys.detail(payload.id))
      const freshWithSubmitted: Department = {
        ...fresh,
        active: payload.values.active,
        settings: {
          ...fresh.settings,
          ...payload.values.settings,
        },
        primaryContactId: payload.values.primaryContactId ?? null,
        secondaryContactId: payload.values.secondaryContactId ?? null,
        billingContactId: payload.values.billingContactId ?? null,
      }
      const merged = mergeDepartmentDetail(prev, freshWithSubmitted)
      queryClient.setQueryData(departmentKeys.detail(payload.id), merged)
      await queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    },
  })
}
