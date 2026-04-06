import { useQuery } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { Department, DepartmentUpsertValues } from "../types"
import { getDepartments } from "../api/departments"

export const DEFAULT_VALUES: DepartmentUpsertValues = {
  code: "",
  name: "",
  active: true,
  address: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  primaryContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  secondaryContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  billingContact: {
    name: "",
    phone: "",
    email: "",
    location: "",
  },
  settings: {
    apportioning: false,
    costAllocation: false,
    autoApportioning: false,
    allowUserCostpoolDirect: false,
    allowMultiCodes: false,
    multiCodes: "",
    removeStartEndTime: false,
    removeSupportingDocument: false,
    removeAutoFillEndTime: false,
  },
}

export const MOCK_MULTI_CODE_OPTIONS = ["CDSS", "MAA", "TCM"]

export const MOCK_CONTACTS = [
    { name: 'admin ieba', phone: '+1 111-222-3333', email: 'admin@ieba.com', location: 'HQ' },
    { name: 'Emma Brettle', phone: '+1 209-223-6737', email: 'ebrettle@amadorgov.org', location: 'Amador' },
    { name: 'Nicole Stewart', phone: '+1 987-654-3210', email: 'nstewart@amadorgov.org', location: 'Office 2' }
]

async function fetchDepartments(status: "active" | "inactive"): Promise<Department[]> {
  const { items } = await getDepartments({ page: 1, limit: 100, status })
  return items
}

export function useGetDepartments(
  status: "active" | "inactive",
  options?: {
    enabled?: boolean
  },
) {
  return useQuery({
    queryKey: [...departmentKeys.lists(), status],
    queryFn: () => fetchDepartments(status),
    // Server is source of truth — never show stale list after DB changes.
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: true,
    enabled: options?.enabled ?? true,
  })
}
