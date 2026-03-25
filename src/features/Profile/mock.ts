import type { ProfileDetailData, ProfileDetailFormValues } from "./types"

export const MOCK_NETWORK_DELAY_MS = 400

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const mockProfileDetail: ProfileDetailData = {
  id: "me",
  firstName: "admin",
  mi: "",
  lastName: "ieba",
  areaCode: "",
  telephoneNumber: "",
  emergencyContact: {
    firstName: "Patricia",
    lastName: "Ingalls",
    areaCode: "209",
    telephoneNumber: "2092472345",
    relationship: "father",
  },
  onRecords: {
    employeeId: "100001",
    positionId: "P01",
    jobClassification: "",
    jobDutyStatement: "JobDutyStatement.pdf",
    primarySupervisor: "",
    secondarySupervisor: "",
    emailLoginId: "superadmin@ieba.com",
    location: "PH-Main",
  },
}

export function updateMockProfileDetail(values: ProfileDetailFormValues): ProfileDetailData {
  mockProfileDetail.firstName = values.firstName
  mockProfileDetail.mi = values.mi
  mockProfileDetail.lastName = values.lastName
  mockProfileDetail.areaCode = values.areaCode
  mockProfileDetail.telephoneNumber = values.telephoneNumber

  mockProfileDetail.emergencyContact = {
    ...mockProfileDetail.emergencyContact,
    ...values.emergencyContact,
  }

  mockProfileDetail.onRecords = {
    ...mockProfileDetail.onRecords,
    ...values.onRecords,
  }

  return mockProfileDetail
}

