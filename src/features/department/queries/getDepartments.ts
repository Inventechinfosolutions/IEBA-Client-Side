import { useQuery } from "@tanstack/react-query"
import { departmentKeys } from "../keys"
import type { Department, DepartmentUpsertValues } from "../types"

export const MOCK_DEPARTMENTS: Department[] = [
  {
    id: "1",
    code: "BH-401300",
    name: "Behavioral Health",
    active: true,
    address: {
      street: "20075 Cedar Rd N",
      city: "Sonora",
      state: "California",
      zip: "95370",
    },
    primaryContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    secondaryContact: {
      name: "Not Assigned",
      phone: "",
      email: "",
      location: "",
    },
    billingContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    settings: {
      apportioning: false,
      costAllocation: false,
      autoApportioning: false,
      allowUserCostpoolDirect: false,
      allowMultiCodes: true,
      multiCodes: "MAA",
      removeStartEndTime: false,
      removeSupportingDocument: false,
      removeAutoFillEndTime: false,
    },
  },
  {
    id: "2",
    code: "PH-401100",
    name: "Public Health",
    active: true,
    address: {
      street: "20111 Cedar Road",
      city: "Sonora",
      state: "CA",
      zip: "95370",
    },
    primaryContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    secondaryContact: {
      name: "Paula Hardojo",
      phone: "",
      email: "phardojo@co.tuolumne.ca.us",
      location: "",
    },
    billingContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    settings: {
      apportioning: false,
      costAllocation: false,
      autoApportioning: false,
      allowUserCostpoolDirect: false,
      allowMultiCodes: true,
      multiCodes: "MAA",
      removeStartEndTime: false,
      removeSupportingDocument: false,
      removeAutoFillEndTime: false,
    },
  },
  {
    id: "3",
    code: "SS-501100",
    name: "Social Services",
    active: true,
    address: {
      street: "20075 Cedar Road N",
      city: "Sonora",
      state: "CA",
      zip: "95370",
    },
    primaryContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    secondaryContact: {
      name: "Paula Hardojo",
      phone: "",
      email: "phardojo@co.tuolumne.ca.us",
      location: "",
    },
    billingContact: {
      name: "Kyle Teuton",
      phone: "",
      email: "kteuton@co.tuolumne.ca.us",
      location: "",
    },
    settings: {
      apportioning: false,
      costAllocation: false,
      autoApportioning: false,
      allowUserCostpoolDirect: false,
      allowMultiCodes: true,
      multiCodes: "MAA",
      removeStartEndTime: false,
      removeSupportingDocument: false,
      removeAutoFillEndTime: false,
    },
  },
]

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

async function fetchDepartments(): Promise<Department[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...MOCK_DEPARTMENTS]
}

export function useGetDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: fetchDepartments,
  })
}
