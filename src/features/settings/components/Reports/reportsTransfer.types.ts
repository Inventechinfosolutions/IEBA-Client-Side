export type ReportsTransferDirection = "assign" | "unassign"

export type ReportsTransferItem = {
  id: string
  name: string
  code?: string
}

export type ReportsTransferPanelProps = {
  title: string
  items: ReportsTransferItem[]
  selectedIds: string[]
  onToggleItem: (id: string) => void
  onToggleAll?: () => void
  searchValue: string
  onSearchChange: (value: string) => void
  isLoading?: boolean
  loadingLabel?: string
  disabled?: boolean
}
