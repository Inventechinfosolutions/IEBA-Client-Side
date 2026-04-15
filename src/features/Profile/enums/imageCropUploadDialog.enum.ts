export const ImageCropDragMode = {
  NONE: "none",
  MOVE_CIRCLE: "move-circle",
  RESIZE_CIRCLE: "resize-circle",
  PAN_IMAGE: "pan-image",
} as const

export type ImageCropDragMode = (typeof ImageCropDragMode)[keyof typeof ImageCropDragMode]

export const ProfileImageOrigin = {
  NONE: "none",
  EXTERNAL: "external",
  INTERNAL: "internal",
} as const

export type ProfileImageOrigin = (typeof ProfileImageOrigin)[keyof typeof ProfileImageOrigin]
