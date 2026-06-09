import { useQuery } from "@tanstack/react-query"
import { userModuleKeys } from "@/features/user/keys"
import { api } from "@/lib/api"

/**
 * The shape of the user assigned departments setting checks derived from UserDetailsDto
 * and aggregated department settings.
 */
export type UserAssignedDepartmentsSettingChecks = {
  apportioningRequired: boolean
  supervisorApportioning: boolean
  autoApportioning: boolean
  manualApportioning: boolean
  allowMultiCodes: boolean
  userMultiCode: Array<{ departmentId: number }>
  departments: Array<{
    departmentId: number
    departmentName?: string | null
    departmentname?: string | null
    apportioning: boolean
    costallocation: boolean
    autoApportioning: boolean
    manualApportioning: boolean
    allowUserOrCostpoolDirect: boolean
    departmentAllowMultiCodes: boolean
    departmentMultiCodes: string[]
    requiresStartEndTime: boolean
    requiresSupportingDoc: boolean
    removeAutoFillEndTime: boolean
    autoFillEndTime: boolean
    requiresDescriptionActivityNotes: boolean
    requiresDescriptionActivityNotesAnchor: boolean
    requiresDescriptionActivityNotesMultiCode: boolean
    requiresSaveAndSubmitButtonMoveToTop: boolean
    allowActivationStartDateAndEndDate: boolean
    requiresActivationStartDateAndEndDate: boolean
    apportioningPercent?: number
    allowedMinutes?: number
  }>
  allowUserEntry: boolean
  timestudyAllowedDepartmentIds: Array<{ departmentId: number }>
  timestudyAllowedRaw: Array<{
    departmentId: number
    departmentName: string | null
    allowed: boolean
    startDate: string | null
    endDate: string | null
    message?: string | null
  }>
  bypassSchedule: boolean
}

/**
 * Fetches user details and derives the setting checks for user-assigned departments.
 *
 * Returns null if the user has no details.
 */
export function useGetUserAssignedDepartmentsSettingChecks(
  userId: string,
  date: string,
  enabled = true,
): import("@tanstack/react-query").UseQueryResult<UserAssignedDepartmentsSettingChecks | null> {
  return useQuery<UserAssignedDepartmentsSettingChecks | null>({
    queryKey: [...userModuleKeys.detail(userId), "user-assigned-departments-setting-checks", date],
    queryFn: async () => {
      if (!userId) return null

      // Fetch settings for departments the user is assigned to
      let checkSettings: any = null
      try {
        const res = await api.get<any>(`/timestudyrecords/user/config?userId=${encodeURIComponent(userId)}&date=${encodeURIComponent(date)}`)
        if (res?.success && res.data) {
          checkSettings = res.data
        }
      } catch (e) {
        console.error("Failed to fetch aggregated department settings", e)
      }

      const allowMultiCodes = checkSettings
        ? (checkSettings.departmentAllowMultiCodes === true ||
          checkSettings.allowMultiCodeForDate === true ||
          (Array.isArray(checkSettings.userMultiCode) && checkSettings.userMultiCode.length > 0))
        : false
      const userMultiCode = checkSettings ? checkSettings.userMultiCode ?? [] : []
      const apportioningRequired = checkSettings ? checkSettings.supervisorApportioning === true : false
      const supervisorApportioning = checkSettings ? checkSettings.supervisorApportioning === true : false

      const timestudyAllowedRaw: Array<{
        departmentId: number
        departmentName: string | null
        allowed: boolean
        startDate: string | null
        endDate: string | null
        message?: string | null
      }> = (Array.isArray(checkSettings?.timestudyAllowed)
        ? checkSettings.timestudyAllowed
        : []
      ).filter(
        (item: any): item is { departmentId: number; departmentName?: string | null; allowed: boolean; startDate: string | null; endDate: string | null } =>
          typeof item?.departmentId === "number" && typeof item?.allowed === "boolean"
      ).map((item: any) => ({
        departmentId: item.departmentId,
        departmentName: item.departmentName ?? null,
        allowed: item.allowed,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        message: item.message ?? null,
      }))

      const bypassSchedule = false
      const timestudyAllowedDepartmentIds = timestudyAllowedRaw
        .filter((item) => item.allowed === true)
        .map((item) => ({ departmentId: item.departmentId }))

      const allowUserEntry = timestudyAllowedDepartmentIds.length > 0

      return {
        apportioningRequired,
        supervisorApportioning,
        autoApportioning: checkSettings ? checkSettings.autoApportioning === true : false,
        manualApportioning: checkSettings ? checkSettings.manualApportioning === true : false,
        allowMultiCodes,
        userMultiCode,
        departments: Array.isArray(checkSettings?.departments) ? checkSettings.departments : [],
        allowUserEntry,
        timestudyAllowedDepartmentIds,
        timestudyAllowedRaw,
        bypassSchedule,
      }
    },
    enabled: !!userId && enabled,
    staleTime: 0,
    gcTime: 0,
  })
}
