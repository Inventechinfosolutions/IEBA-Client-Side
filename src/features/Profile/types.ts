export const RELATIONSHIP_OPTIONS = [
  "father",
  "brother",
  "mother",
  "other",
  "sister",
  "spouse",
] as const

export type Relationship = (typeof RELATIONSHIP_OPTIONS)[number]

export type EmergencyContactValues = {
  firstName: string
  lastName: string
  areaCode: string
  telephoneNumber: string
  relationship: Relationship
}

export type OnRecordsValues = {
  employeeId: string
  positionId: string
  jobClassification: string
  jobDutyStatement: string
  primarySupervisor: string
  secondarySupervisor: string
  emailLoginId: string
  location: string
}

export type ProfileDetailFormValues = {
  firstName: string
  mi: string
  lastName: string
  areaCode: string
  telephoneNumber: string
  emergencyContact: EmergencyContactValues
  onRecords: OnRecordsValues
}

export type ProfileDetailData = {
  id: string
} & ProfileDetailFormValues

export type UpdateProfileDetailInput = {
  id: string
  values: ProfileDetailFormValues
}
