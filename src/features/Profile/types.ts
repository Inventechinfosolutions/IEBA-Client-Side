import type { UserRelationship } from "./enums/userrelationship.enum"

export { UserRelationship, RELATIONSHIP_OPTIONS } from "./enums/userrelationship.enum"

export type EmergencyContactValues = {
  firstName: string
  lastName: string
  areaCode: string
  telephoneNumber: string
  /** Backend relationship (falls back to FATHER if missing) */
  relationship: UserRelationship
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

/** Server-backed fields used when saving; not part of the form schema. */
export type ProfilePersistFields = {
  primarySupervisorUserId?: string
  backupSupervisorUserId?: string
  locationId?: number
  jobClassificationIds: number[]
}

export type ProfileDetailData = {
  id: string
  persist?: ProfilePersistFields
} & ProfileDetailFormValues

export type UpdateProfileDetailInput = {
  id: string
  values: ProfileDetailFormValues
  persist?: ProfilePersistFields
}
