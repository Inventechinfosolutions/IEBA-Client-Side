import type { SupervisorApportioningConfig } from "../queries/getUserApportioningConfig"

export type ApportioningPanelProps = {
  apportioningConfig: SupervisorApportioningConfig | null | undefined
  supervisorOwnMinutesToday: number
  dropdownData?: unknown[]
  apportioningRecords?: unknown[]
}

/**
 * Apportioning UI for supervisors. Stubbed until the full panel is restored in-repo.
 */
export function PersonalTimeStudyApportioningPanel(_props: ApportioningPanelProps) {
  return null
}
