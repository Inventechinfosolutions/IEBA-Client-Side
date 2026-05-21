import { useQuery } from "@tanstack/react-query"
import { apiGetUserDetails } from "@/features/user/api"
import { userModuleKeys } from "@/features/user/keys"
import { getDepartmentById } from "@/features/department/api/departments"

/**
 * The shape of the supervisor apportioning config derived from UserDetailsDto.
 * This tells the form whether to show the apportioning panel, which departments
 * are involved, their percentages, and whether auto-apportioning is enabled.
 */
export type SupervisorApportioningConfig = {
  apportioningRequired: boolean
  allowMultiCodes: boolean
  departments: Array<{
    departmentId: number
    departmentName: string
    apportioningPercent: number
    allowedMinutes: number
    autoApportioning: boolean
  }>
  settings: {
    moveSaveSubmitToTop: boolean
    removeAutoFillEndTime: boolean
    removeStartEndTime: boolean
    removeSupportingDocument: boolean
    removeDescriptionActivityNote: boolean
    removeDescriptionActivityNoteAnchor: boolean
    removeDescriptionActivityNoteMultiCode: boolean
  }
}

/**
 * Fetches user details and derives the supervisor apportioning config
 * for the PersonalTimeStudyEntryForm apportioning panel, as well as
 * aggregated department settings.
 *
 * Returns null if the user has no details.
 */
export function useGetUserApportioningConfig(
  userId: string,
  enabled = true,
): import("@tanstack/react-query").UseQueryResult<SupervisorApportioningConfig | null> {
  return useQuery<SupervisorApportioningConfig | null>({
    queryKey: [...userModuleKeys.detail(userId), "apportioning-config"],
    queryFn: async () => {
      if (!userId) return null
      const details = await apiGetUserDetails(userId)
      if (!details) return null

      // Fetch settings for all departments the user is assigned to
      const depts = details.departments || []
      const deptSettings = await Promise.all(
        depts.map(async (d: any) => {
          try {
            return await getDepartmentById(String(d.id))
          } catch (e) {
            console.error("Failed to fetch department settings for", d.id, e)
            return null
          }
        })
      )

      const settings = {
        moveSaveSubmitToTop: deptSettings.some((ds) => ds?.settings?.moveSaveSubmitToTop === true),
        removeAutoFillEndTime: deptSettings.some((ds) => ds?.settings?.removeAutoFillEndTime === true),
        removeStartEndTime: deptSettings.some((ds) => ds?.settings?.removeStartEndTime === true),
        removeSupportingDocument: deptSettings.some((ds) => ds?.settings?.removeSupportingDocument === true),
        removeDescriptionActivityNote: deptSettings.some((ds) => ds?.settings?.removeDescriptionActivityNote === true),
        removeDescriptionActivityNoteAnchor: deptSettings.some((ds) => ds?.settings?.removeDescriptionActivityNoteAnchor === true),
        removeDescriptionActivityNoteMultiCode: deptSettings.some((ds) => ds?.settings?.removeDescriptionActivityNoteMultiCode === true),
      }

      const allowMultiCodes = details.allowMultiCodes === true ||
        deptSettings.some((ds) => ds?.settings?.allowMultiCodes === true)

      const apportioningRequired = details.supervisorApportioning === true ||
        (details.departmentsRoles ?? []).some((dr) => dr.apportioningRequired === true)

      if (!apportioningRequired) {
        return {
          apportioningRequired: false,
          allowMultiCodes,
          departments: [],
          settings,
        }
      }

      // Build per-department apportioning info
      const departments = (details.departmentsRoles ?? [])
        .filter((dr) => dr.apportioningRequired === true)
        .map((dr) => ({
          departmentId: dr.departmentId,
          departmentName: dr.department?.name ?? `Dept ${dr.departmentId}`,
          apportioningPercent: dr.apportioning ?? 0,
          allowedMinutes: 0, // Runtime-calculated: backend fills this per day
          autoApportioning: true, // Backend always auto-calculates for supervisors
        }))

      return {
        apportioningRequired: true,
        allowMultiCodes,
        departments,
        settings,
      }
    },
    enabled: !!userId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — user config rarely changes
    gcTime: 10 * 60 * 1000,
  })
}
