import { useMutation } from "@tanstack/react-query"

import {
  assignUserActivitiesTs,
  assignUserProgramsTs,
  unassignUserActivitiesTs,
  unassignUserProgramsTs,
} from "../api"
import type { AssignUserActivitiesApiBody, AssignUserProgramsApiBody } from "../types"

export function useAssignUserProgramsTs() {
  return useMutation({
    mutationFn: (body: AssignUserProgramsApiBody) => assignUserProgramsTs(body),
  })
}

export function useUnassignUserProgramsTs() {
  return useMutation({
    mutationFn: (body: AssignUserProgramsApiBody) => unassignUserProgramsTs(body),
  })
}

export function useAssignUserActivitiesTs() {
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => assignUserActivitiesTs(body),
  })
}

export function useUnassignUserActivitiesTs() {
  return useMutation({
    mutationFn: (body: AssignUserActivitiesApiBody) => unassignUserActivitiesTs(body),
  })
}
