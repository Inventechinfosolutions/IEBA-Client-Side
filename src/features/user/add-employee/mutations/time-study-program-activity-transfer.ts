import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignUserActivitiesTs,
  assignUserProgramsTs,
  unassignUserActivitiesTs,
  unassignUserProgramsTs,
} from "../api"
import { addEmployeeLookupKeys } from "../keys"
import { refetchTsProgramsAndActivitiesForDepartment } from "../utility/refetchTsProgramsActivities"
import type { AssignUserActivitiesApiBody, AssignUserProgramsApiBody } from "../types"

/** Includes departmentId for cache refetch only (not sent to assign/unassign program APIs). */
export type TsProgramTransferVariables = AssignUserProgramsApiBody & {
  departmentId: number
}

async function afterTsProgramTransferSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: TsProgramTransferVariables,
): Promise<void> {
  const uid = variables.userId.trim()
  if (!uid) return
  await refetchTsProgramsAndActivitiesForDepartment(
    queryClient,
    uid,
    variables.departmentId,
  )
}

async function afterTsActivityTransferSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  variables: AssignUserActivitiesApiBody,
): Promise<void> {
  const uid = variables.userId.trim()
  if (!uid) return
  await refetchTsProgramsAndActivitiesForDepartment(
    queryClient,
    uid,
    variables.departmentId,
  )
  if (variables.departmentId >= 1) {
    void queryClient.invalidateQueries({
      queryKey: addEmployeeLookupKeys.activityDepartmentsByDepartment(
        String(variables.departmentId),
      ),
    })
  }
}

export function useAssignUserProgramsTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, programs }: TsProgramTransferVariables) =>
      assignUserProgramsTs({ userId, programs }),
    onSuccess: async (_void, variables) => {
      await afterTsProgramTransferSuccess(queryClient, variables)
    },
  })
}

export function useUnassignUserProgramsTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, programs }: TsProgramTransferVariables) =>
      unassignUserProgramsTs({ userId, programs }),
    onSuccess: async (_void, variables) => {
      await afterTsProgramTransferSuccess(queryClient, variables)
    },
  })
}

export function useAssignUserActivitiesTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => assignUserActivitiesTs(body),
    onSuccess: async (_void, variables) => {
      await afterTsActivityTransferSuccess(queryClient, variables)
    },
  })
}

export function useUnassignUserActivitiesTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => unassignUserActivitiesTs(body),
    onSuccess: async (_void, variables) => {
      await afterTsActivityTransferSuccess(queryClient, variables)
    },
  })
}
