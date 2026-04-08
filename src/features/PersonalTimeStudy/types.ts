import type { PersonalTimeStudyViewMode } from "./enums/PersonalTimeStudy.enum"

export * from "./enums/PersonalTimeStudy.enum"

export type PersonalTimeStudyFilterFormValues = {
  search: string
}

export type PersonalTimeStudyPagination = {
  page: number
  pageSize: number
  totalItems: number
}

/** Placeholder row shape — replace when API contract is defined. */
export type PersonalTimeStudyRow = {
  id: string
  label: string
}

export type PersonalTimeStudyPageState = {
  viewMode: PersonalTimeStudyViewMode
}
