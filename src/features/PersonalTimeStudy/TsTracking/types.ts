export type TsTrackingStatus = "approved" | "submitted" | "draft"

export type TsTrackingStatusFilter = TsTrackingStatus | "all"

export type TsTrackingRow = {
  id: string
  name: string
  department: string
  date?: string
  status: TsTrackingStatus
}

export type TsTrackingOpenTarget = {
  userId: string
  date?: string
  status: TsTrackingStatus
}

export type TsTrackingPageProps = {
  /** Open Time Study MGT focused on this user/date. */
  onOpenInMgt: (target: TsTrackingOpenTarget) => void
}
