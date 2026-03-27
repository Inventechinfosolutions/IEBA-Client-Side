import type React from "react"

// Drag interaction mode for the custom crop circle
export type DragMode = "none" | "move-circle" | "resize-circle" | "pan-image"

// Snapshot of values captured at the moment a drag begins
export type DragStart = {
  clientX: number
  clientY: number
  cx: number   // circle centre x at drag start
  cy: number   // circle centre y at drag start
  ox: number   // image offset x at drag start
  oy: number   // image offset y at drag start
  cs: number   // cropSize at drag start
}

export type ImageCropUploadDialogProps = {
  title: string
  onImageCropped: (dataUrl: string) => void
  onCropError?: () => void
  onConfirmWithoutImage?: () => void
  renderTrigger: (actions: { openDialog: () => void }) => React.ReactNode
}
