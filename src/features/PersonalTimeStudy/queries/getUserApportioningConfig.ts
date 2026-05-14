import { useQuery } from "@tanstack/react-query"
import { apiGetUserDetails } from "@/features/user/api"


/** A single department's apportioning configuration for the supervisor. */
export type SupervisorDeptApportioningConfig = {
  departmentId: number
  departmentName: string
  /** Percentage of tsmins allocated for apportioning (e.g. 50 = 50%). */
  apportioningPercent: number
  /** Computed allowed minutes = tsmins * apportioningPercent / 100 */
  allowedMinutes: number
  /** Auto apportioning is ON — the backend distributes time automatically. */
  autoApportioning: boolean
}

/** Full apportioning config for a supervisor user. */
export type SupervisorApportioningConfig = {
  /**
   * True when at least one department role has apportioning configured with a positive percent.
   * Drives the read-only apportioning panel.
   */
  apportioningRequired: boolean
  /**
   * From GET /users/:id/details `allowMultiCodes`. When true, Personal Time Study shows the
   * per-row (+) control to add multi-code child rows.
   */
  allowMultiCodes: boolean
  /** The user's allocated time study minutes per day. */
  tsmins: number
  departments: SupervisorDeptApportioningConfig[]
}

/** Query key factory for user apportioning config. */
const userApportioningConfigKeys = {
  config: (userId: string) => ["userApportioningConfig", userId] as const,
}


export function useGetUserApportioningConfig(userId: string, enabled = true) {
  return useQuery({
    queryKey: userApportioningConfigKeys.config(userId),
    queryFn: async (): Promise<SupervisorApportioningConfig> => {
      const details = await apiGetUserDetails(userId)

      const tsmins = typeof details.tsmins === "number" ? details.tsmins : 480

      // Filter to supervisor-role department entries that have apportioning ON
      const apportioningDepts = (details.departmentsRoles ?? []).filter(
        (dr) => dr.apportioningRequired === true && (dr.apportioning ?? 0) > 0,
      )

      const departments: SupervisorDeptApportioningConfig[] = apportioningDepts.map((dr) => {
        const percent = dr.apportioning ?? 0
        return {
          departmentId: dr.departmentId,
          departmentName: dr.department?.name ?? `Dept ${dr.departmentId}`,
          apportioningPercent: percent,
          allowedMinutes: Math.round((tsmins * percent) / 100),
          // autoApportioning is true by default when apportioningRequired is set
          // (the backend's calculateApportioningBetweenDates handles distribution automatically)
          autoApportioning: true,
        }
      })

      const allowMultiCodes = details.allowMultiCodes === true

      return {
        apportioningRequired: apportioningDepts.length > 0,
        allowMultiCodes,
        tsmins,
        departments,
      }
    },
    enabled: !!userId && enabled,
    // Apportioning config doesn't change during a session — cache for 5 minutes
    staleTime: 5 * 60 * 1000,
  })
}
