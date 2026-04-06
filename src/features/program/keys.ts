import type { GetProgramsParams } from "./types"

export const programKeys = {
  all: ["program"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  list: (params: GetProgramsParams) => [...programKeys.lists(), params] as const,
  details: () => [...programKeys.all, "detail"] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
}

/** Program Activity Relation tab — dual-list queries (shared key shape for cache + mutations). */
export const programActivityRelationKeys = {
  root: ["program", "par"] as const,
  timeStudyPrograms: (departmentId: number | undefined) =>
    [...programActivityRelationKeys.root, "timestudyprograms", departmentId] as const,
  activitiesScope: (departmentId: number | undefined, programId: number | undefined) =>
    [...programActivityRelationKeys.root, "activities", departmentId, programId] as const,
}
