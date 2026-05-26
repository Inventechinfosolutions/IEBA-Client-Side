import { useQuery } from "@tanstack/react-query"
import { userModuleKeys } from "@/features/user/keys"
import { api } from "@/lib/api"

/**
 * The shape of the user assigned departments setting checks derived from UserDetailsDto
 * and aggregated department settings.
 */
export type UserAssignedDepartmentsSettingChecks = {
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
 * Fetches user details and derives the setting checks for user-assigned departments.
 *
 * Returns null if the user has no details.
 */
export function useGetUserAssignedDepartmentsSettingChecks(
  userId: string,
  enabled = true,
): import("@tanstack/react-query").UseQueryResult<UserAssignedDepartmentsSettingChecks | null> {
  return useQuery<UserAssignedDepartmentsSettingChecks | null>({
    queryKey: [...userModuleKeys.detail(userId), "user-assigned-departments-setting-checks"],
    queryFn: async () => {
      if (!userId) return null

      // Fetch aggregated settings for all departments the user is assigned to
      let checkSettings: any = null
      try {
        const res = await api.get<any>(`/timestudyrecords/user/config?userId=${encodeURIComponent(userId)}`)
        if (res?.success && res.data) {
          checkSettings = res.data
        }
      } catch (e) {
        console.error("Failed to fetch aggregated department settings", e)
      }

      const settings = {
        moveSaveSubmitToTop: checkSettings ? checkSettings.requiresSaveAndSubmitButtonMoveToTop === false : false,
        removeAutoFillEndTime: checkSettings ? checkSettings.removeAutoFillEndTime === true : false,
        removeStartEndTime: checkSettings ? checkSettings.requiresStartEndTime === false : false,
        removeSupportingDocument: checkSettings ? checkSettings.requiresSupportingDoc === false : false,
        removeDescriptionActivityNote: checkSettings ? checkSettings.requiresDescriptionActivityNotes === false : false,
        removeDescriptionActivityNoteAnchor: checkSettings ? checkSettings.requiresDescriptionActivityNotesAnchor === false : false,
        removeDescriptionActivityNoteMultiCode: checkSettings ? checkSettings.requiresDescriptionActivityNotesMultiCode === false : false,
      }

      const allowMultiCodes = checkSettings ? checkSettings.departmentAllowMultiCodes === true : false
      const apportioningRequired = checkSettings ? checkSettings.apportioning === true : false

      return {
        apportioningRequired,
        allowMultiCodes,
        departments: [],
        settings,
      }
    },
    enabled: !!userId && enabled,
    staleTime: 0,
    gcTime: 0,
  })
}
