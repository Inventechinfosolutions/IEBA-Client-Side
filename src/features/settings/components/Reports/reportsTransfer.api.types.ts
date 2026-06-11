export type ReportTransferBucketMode = "include" | "exclude"

export type MasterCodeActivityTransferItem = {
  id: number
  code: string
  name: string
  displayLabel?: string
}

export type MasterCodeTransferRow = {
  id: number
  name: string
  allowMulticode?: boolean
  status?: string
  activities?: MasterCodeActivityTransferItem[]
}

export type MasterCodeTransferBuckets = {
  excluded: MasterCodeTransferRow[]
  included: MasterCodeTransferRow[]
}

export type ActivityTransferBuckets = {
  excluded: MasterCodeActivityTransferItem[]
  included: MasterCodeActivityTransferItem[]
}

export type ReportTransferFlags = {
  masterCodeFlag: MasterCodeTransferBuckets
  activityFlag: ActivityTransferBuckets
}
