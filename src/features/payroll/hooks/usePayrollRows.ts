import { useGetPayrollRows } from "../queries/getPayrollRows"
import type { GetPayrollRowsParams } from "../types"

export function usePayrollRows(activeParams: GetPayrollRowsParams | null) {
  const query = useGetPayrollRows(activeParams)
  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
