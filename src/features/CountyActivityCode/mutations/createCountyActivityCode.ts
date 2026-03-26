import { useMutation, useQueryClient } from "@tanstack/react-query"

import { countyActivityCodeKeys } from "../keys"
import type { CountyActivityAddFormValues, CountyActivityCodeRow } from "../types"

type CreateCountyActivityCodeInput = {
  values: CountyActivityAddFormValues
  tab: "primary" | "sub"
  parentId?: string | null
}

function createRowId(): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `county-activity-${uuid}`
  return `county-activity-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useCreateCountyActivityCode() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ values, tab, parentId }: CreateCountyActivityCodeInput) => {
      const prevRows = queryClient.getQueryData<CountyActivityCodeRow[]>(
        countyActivityCodeKeys.lists()
      )
      const parent =
        tab === "sub"
          ? parentId
            ? (prevRows ?? []).find((row) => row.id === parentId)
            : (prevRows ?? []).find(
                (row) => row.rowType === "primary" && row.masterCode === values.masterCode
              )
          : null

      const newRow: CountyActivityCodeRow = {
        id: createRowId(),
        spmp: false,
        ...values,
        rowType: tab === "sub" ? "sub" : "primary",
        parentId: tab === "sub" ? (parent?.id ?? null) : null,
        ...(tab === "sub"
          ? {
              department: "",
              masterCodeType: "",
              masterCode: 0,
            }
          : null),
      }

      queryClient.setQueryData<CountyActivityCodeRow[]>(
        countyActivityCodeKeys.lists(),
        (prev) => [newRow, ...(prev ?? [])]
      )

      return newRow
    },
  })
}

