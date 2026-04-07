import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignUserActivitiesTs,
  assignUserProgramsTs,
  unassignUserActivitiesTs,
  unassignUserProgramsTs,
} from "../api"
import { addEmployeeLookupKeys } from "../keys"
import type { AssignUserActivitiesApiBody, AssignUserProgramsApiBody } from "../types"

export function useAssignUserProgramsTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserProgramsApiBody) => assignUserProgramsTs(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userProgramsActivities(uid) })
    },
  })
}

export function useUnassignUserProgramsTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserProgramsApiBody) => unassignUserProgramsTs(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userProgramsActivities(uid) })
    },
  })
}

export function useAssignUserActivitiesTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => assignUserActivitiesTs(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userProgramsActivities(uid) })
      if (body.departmentId >= 1) {
        void queryClient.invalidateQueries({
          queryKey: addEmployeeLookupKeys.activityDepartmentsByDepartment(String(body.departmentId)),
        })
      }
    },
  })
}

export function useUnassignUserActivitiesTs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => unassignUserActivitiesTs(body),
    onSuccess: (_void, body) => {
      const uid = body.userId.trim()
      if (!uid) return
      void queryClient.invalidateQueries({ queryKey: addEmployeeLookupKeys.userProgramsActivities(uid) })
      if (body.departmentId >= 1) {
        void queryClient.invalidateQueries({
          queryKey: addEmployeeLookupKeys.activityDepartmentsByDepartment(String(body.departmentId)),
        })
      }
    },
  })
}
