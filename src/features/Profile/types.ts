import type { ReactNode } from "react"
import type { UserRelationship } from "./enums/userrelationship.enum"
import type { ImageCropDragMode, ProfileImageOrigin } from "./enums/imageCropUploadDialog.enum"

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

export type UploadProfileImageInput = {
  userId: string
  /** Cropped image data URL (`data:image/png;base64,...`). */
  dataUrl: string
  /** Name used for the multipart `file` field. */
  fileName?: string
}

export type ProfileApiErrorBody = {
  message?: string | string[]
  error?: string
}

export type UploadProfileImageResponse = {
  storageKey: string
}

export type ImageCropOffset = {
  x: number
  y: number
}

export type ImageCropDragStart = {
  clientX: number
  clientY: number
  cx: number
  cy: number
  ox: number
  oy: number
  cs: number
}

export type ImageCropUploadDialogRenderActions = {
  openDialog: () => void
}

export type ImageCropUploadDialogProps = {
  title: string
  onImageCropped: (dataUrl: string) => void
  initialImageSrc?: string | null
  onDeleteImage?: () => Promise<void> | void
  onCropError?: () => void
  onConfirmWithoutImage?: () => void
  renderTrigger: (actions: ImageCropUploadDialogRenderActions) => ReactNode
}

export type ProfileImageUploadFormValues = {
  imageFile: File | null
}

export type ImageCropState = {
  imageOrigin: ProfileImageOrigin
  dragMode: ImageCropDragMode
}

export type ProfileDetailFormProps = {
  initialValues: ProfileDetailFormValues
  onSubmit: (values: ProfileDetailFormValues) => Promise<void>
  onCancel: () => void
  isSaving: boolean
}
