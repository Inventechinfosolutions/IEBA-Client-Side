import type { PersonalTimeStudyRow } from "../types"

type PersonalTimeStudyTableProps = {
  rows: PersonalTimeStudyRow[]
  isLoading?: boolean
}

export function PersonalTimeStudyTable({
  rows,
  isLoading = false,
}: PersonalTimeStudyTableProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading…</div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No personal time study data yet.
      </div>
    )
  }

  return (
    <ul className="list-inside list-disc text-sm">
      {rows.map((row) => (
        <li key={row.id}>{row.label}</li>
      ))}
    </ul>
  )
}
