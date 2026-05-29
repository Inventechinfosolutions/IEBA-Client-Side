import type { QueryClient } from "@tanstack/react-query"

import {
  fetchSecurityDepartmentRoles,
  fetchUserAllowMulticodeHistory,
  fetchUserDetailsTab,
} from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type { AddEmployeeFormTab, UserModuleFormValues } from "../types"
import {
  roleNamesFromSecuritySnapshots,
} from "./parseSecurityDepartmentRoles"
import {
  apportioningFieldsFromTab2,
  parseUserDetailsTab2,
} from "./syncSecurityTab2Form"

export type UserDetailsTab1Dto = {
  id: string
  positionName?: string | null
  jobClassificationIds?: number[]
  employeeId?: string | null
  claimingUnit?: string | null
  firstName: string
  lastName: string
  name: string
  status: string
  spmp?: boolean
  multilingual?: boolean
  pki?: boolean
  user: { loginId: string }
  location?: { id: number; name: string } | null
  documents?: Array<{ id?: number; docType: string; fileName: string }>
}

export type UserDetailsTab3SupervisorRow = {
  id: string
  loginId?: string
  name: string
}

export type UserDetailsTab3Dto = {
  id: string
  firstName: string
  lastName: string
  name: string
  claimingUnit?: string | null
  primarySupervisor?: { id: string; name: string } | null
  backupSupervisor?: { id: string; name: string } | null
  supervisors?: UserDetailsTab3SupervisorRow[]
}

/** Resolves job classification ids from tab1 payload (`jobClassificationIds` or `jobClassifications[].id`). */
export function jobClassificationIdsFromTab1Payload(
  payload: Record<string, unknown> | null | undefined,
): number[] {
  if (!payload) return []
  const fromIds = Array.isArray(payload.jobClassificationIds)
    ? (payload.jobClassificationIds as unknown[])
    : []
  const ids = fromIds
    .map((n) => (typeof n === "number" ? n : Number(n)))
    .filter((n) => Number.isInteger(n) && n >= 1)
  if (ids.length > 0) {
    return [...new Set(ids)].sort((a, b) => a - b)
  }
  const fromRows = Array.isArray(payload.jobClassifications) ? payload.jobClassifications : []
  const rowIds: number[] = []
  for (const row of fromRows) {
    if (row === null || typeof row !== "object") continue
    const id = (row as { id?: unknown }).id
    const n = typeof id === "number" ? id : Number(id)
    if (Number.isInteger(n) && n >= 1) rowIds.push(n)
  }
  return [...new Set(rowIds)].sort((a, b) => a - b)
}

export function parseUserDetailsTab1(payload: Record<string, unknown>): UserDetailsTab1Dto {
  return {
    id: String(payload.id ?? "").trim(),
    positionName: (payload.positionName as string | null | undefined) ?? null,
    jobClassificationIds: jobClassificationIdsFromTab1Payload(payload),
    employeeId: (payload.employeeId as string | null | undefined) ?? null,
    claimingUnit: (payload.claimingUnit as string | null | undefined) ?? null,
    firstName: String(payload.firstName ?? "").trim(),
    lastName: String(payload.lastName ?? "").trim(),
    name: String(payload.name ?? "").trim(),
    status: String(payload.status ?? "").trim(),
    spmp: payload.spmp as boolean | undefined,
    multilingual: payload.multilingual as boolean | undefined,
    pki: payload.pki as boolean | undefined,
    user: (payload.user as { loginId: string }) ?? { loginId: "" },
    location: (payload.location as { id: number; name: string } | null | undefined) ?? null,
    documents: Array.isArray(payload.documents)
      ? (payload.documents as UserDetailsTab1Dto["documents"])
      : [],
  }
}

export function parseUserDetailsTab3(payload: Record<string, unknown>): UserDetailsTab3Dto {
  const supervisors = Array.isArray(payload.supervisors)
    ? (payload.supervisors as UserDetailsTab3SupervisorRow[])
    : []

  return {
    id: String(payload.id ?? "").trim(),
    firstName: String(payload.firstName ?? "").trim(),
    lastName: String(payload.lastName ?? "").trim(),
    name: String(payload.name ?? "").trim(),
    claimingUnit: (payload.claimingUnit as string | null | undefined) ?? null,
    primarySupervisor:
      (payload.primarySupervisor as { id: string; name: string } | null | undefined) ?? null,
    backupSupervisor:
      (payload.backupSupervisor as { id: string; name: string } | null | undefined) ?? null,
    supervisors,
  }
}

/**
 * After GET …/details/required?method=tab1, copy job classification (and location) into RHF
 * when the form still has empty defaults from the list row.
 */
export function syncTab1EmployeeLoginFields(
  setValue: import("react-hook-form").UseFormSetValue<UserModuleFormValues>,
  getValues: import("react-hook-form").UseFormGetValues<UserModuleFormValues>,
  tab1Payload: Record<string, unknown>,
): void {
  const jobIds = jobClassificationIdsFromTab1Payload(tab1Payload)
  if (jobIds.length > 0 && (getValues("jobClassificationIds") ?? []).length === 0) {
    setValue("jobClassificationIds", jobIds, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    })
  }

  const location = tab1Payload.location as { id?: number; name?: string } | null | undefined
  if (location != null && typeof location.id === "number" && location.id >= 1) {
    if (getValues("locationId") == null) {
      setValue("locationId", location.id, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      })
    }
    const locName = typeof location.name === "string" ? location.name.trim() : ""
    if (locName && !(getValues("location") ?? "").trim()) {
      setValue("location", locName, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      })
    }
  }
}

/** Applies GET /users/:id/details/required?method=tab3 onto Supervisor tab form fields. */
export function syncSupervisorTab3Form(
  setValue: import("react-hook-form").UseFormSetValue<UserModuleFormValues>,
  tab3: UserDetailsTab3Dto,
) {
  setValue("claimingUnit", (tab3.claimingUnit ?? "").trim(), {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("supervisorPrimary", tab3.primarySupervisor?.name?.trim() ?? "", {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("supervisorSecondary", tab3.backupSupervisor?.name?.trim() ?? "", {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("supervisorPrimaryId", tab3.primarySupervisor?.id?.trim() ?? "", {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
  setValue("supervisorSecondaryId", tab3.backupSupervisor?.id?.trim() ?? "", {
    shouldDirty: false,
    shouldTouch: false,
    shouldValidate: true,
  })
}

export function mergeTab1IntoFormValues(
  tab1: UserDetailsTab1Dto,
  previous: UserModuleFormValues,
): UserModuleFormValues {
  const login = tab1.user?.loginId?.trim() ?? previous.loginId
  const active =
    tab1.status.trim() !== "" ? tab1.status.toLowerCase() === "active" : previous.active
  const jobDutyDoc = (tab1.documents ?? []).find(
    (d) => d.docType === "job_duty" || d.docType === "jobdutystatement",
  )

  return {
    ...previous,
    employeeNo: String(tab1.employeeId ?? tab1.id ?? previous.employeeNo).trim(),
    firstName: tab1.firstName || previous.firstName,
    lastName: tab1.lastName || previous.lastName,
    location: tab1.location?.name?.trim() ?? previous.location,
    locationId: tab1.location?.id ?? previous.locationId,
    loginId: login,
    emailAddress: login,
    positionNo: tab1.positionName?.trim() ?? previous.positionNo,
    jobClassificationIds:
      tab1.jobClassificationIds !== undefined
        ? [...new Set(tab1.jobClassificationIds.filter((n) => Number.isInteger(n) && n >= 1))].sort(
            (a, b) => a - b,
          )
        : previous.jobClassificationIds,
    claimingUnit: (tab1.claimingUnit ?? "").trim() || previous.claimingUnit,
    spmp: typeof tab1.spmp === "boolean" ? tab1.spmp : previous.spmp,
    multilingual: typeof tab1.multilingual === "boolean" ? tab1.multilingual : previous.multilingual,
    pkiUser: typeof tab1.pki === "boolean" ? tab1.pki : previous.pkiUser,
    active,
    jobDutyStatement: jobDutyDoc?.fileName?.trim() || previous.jobDutyStatement,
    jobDutyFileId: jobDutyDoc?.id ?? previous.jobDutyFileId,
  }
}

export function mergeTab3IntoFormValues(
  tab3: UserDetailsTab3Dto,
  previous: UserModuleFormValues,
): UserModuleFormValues {
  return {
    ...previous,
    claimingUnit: (tab3.claimingUnit ?? "").trim() || previous.claimingUnit,
    supervisorPrimary: tab3.primarySupervisor?.name?.trim() ?? previous.supervisorPrimary,
    supervisorSecondary: tab3.backupSupervisor?.name?.trim() ?? previous.supervisorSecondary,
    supervisorPrimaryId: tab3.primarySupervisor?.id?.trim() ?? previous.supervisorPrimaryId,
    supervisorSecondaryId: tab3.backupSupervisor?.id?.trim() ?? previous.supervisorSecondaryId,
  }
}

async function fetchTab1(queryClient: QueryClient, userId: string): Promise<UserDetailsTab1Dto> {
  const raw = await queryClient.fetchQuery({
    queryKey: addEmployeeLookupKeys.userDetailsTab(userId, "tab1"),
    queryFn: () => fetchUserDetailsTab(userId, "tab1"),
    staleTime: 0,
  })
  return parseUserDetailsTab1(raw)
}

async function fetchTab2(queryClient: QueryClient, userId: string) {
  return queryClient.fetchQuery({
    queryKey: addEmployeeLookupKeys.userDetailsTab(userId, "tab2"),
    queryFn: () => fetchUserDetailsTab(userId, "tab2"),
    staleTime: 0,
  })
}

async function fetchTab3(queryClient: QueryClient, userId: string): Promise<UserDetailsTab3Dto> {
  const raw = await queryClient.fetchQuery({
    queryKey: addEmployeeLookupKeys.userDetailsTab(userId, "tab3"),
    queryFn: () => fetchUserDetailsTab(userId, "tab3"),
    staleTime: 0,
  })
  return parseUserDetailsTab3(raw)
}

/**
 * After PUT/POST on a user form tab, refresh only that tab's GET …/details/required slice
 * (not GET /users/:id/details).
 */
export async function refetchFormAfterTabSave(
  queryClient: QueryClient,
  userId: string,
  sourceTab: AddEmployeeFormTab,
  values: UserModuleFormValues,
): Promise<UserModuleFormValues> {
  const id = userId.trim()
  if (!id) return values

  switch (sourceTab) {
    case "employee": {
      const tab1 = await fetchTab1(queryClient, id)
      return mergeTab1IntoFormValues(tab1, values)
    }
    case "security": {
      const [securityRoles, tab2Raw] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: addEmployeeLookupKeys.securityDepartmentRoles(id),
          queryFn: () => fetchSecurityDepartmentRoles(id),
          staleTime: 0,
        }),
        fetchTab2(queryClient, id),
        queryClient.fetchQuery({
          queryKey: addEmployeeLookupKeys.userAllowMulticodeHistory(id),
          queryFn: () => fetchUserAllowMulticodeHistory(id),
          staleTime: 0,
        }),
      ])
      return {
        ...values,
        securityAssignedSnapshots: securityRoles.assignedSnapshots,
        roleAssignments: roleNamesFromSecuritySnapshots(securityRoles.assignedSnapshots),
        ...apportioningFieldsFromTab2(parseUserDetailsTab2(tab2Raw as Record<string, unknown>)),
      }
    }
    case "supervisor": {
      const tab3 = await fetchTab3(queryClient, id)
      return mergeTab3IntoFormValues(tab3, values)
    }
    case "timeStudy":
      return values
    default:
      return values
  }
}

export function invalidateUserTabCaches(
  queryClient: QueryClient,
  userId: string,
  sourceTab: AddEmployeeFormTab,
): void {
  const id = userId.trim()
  if (!id) return

  if (sourceTab === "employee") {
    void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userDetailsTab(id, "tab1") })
    return
  }
  if (sourceTab === "security") {
    void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userDetailsTab(id, "tab2") })
    void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.securityDepartmentRoles(id) })
    void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userAllowMulticodeHistory(id) })
    return
  }
  if (sourceTab === "supervisor") {
    void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userDetailsTab(id, "tab3") })
  }
}
