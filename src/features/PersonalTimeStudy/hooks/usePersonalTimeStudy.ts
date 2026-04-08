import { useMemo, useState } from "react"

import type {
  PersonalTimeStudyFilterFormValues,
  PersonalTimeStudyPagination,
  PersonalTimeStudyRow,
} from "../types"
import { personalTimeStudyFilterDefaultValues } from "../schemas"

const DEFAULT_PAGINATION: PersonalTimeStudyPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
}

/**
 * Local UI state scaffold — wire to queries when APIs exist.
 */
export function usePersonalTimeStudy() {
  const [filters, setFilters] = useState<PersonalTimeStudyFilterFormValues>(
    personalTimeStudyFilterDefaultValues
  )
  const [pagination, setPagination] =
    useState<PersonalTimeStudyPagination>(DEFAULT_PAGINATION)

  const rows = useMemo<PersonalTimeStudyRow[]>(() => [], [])

  return {
    rows,
    filters,
    setFilters,
    pagination,
    setPagination,
    isLoading: false,
  }
}
