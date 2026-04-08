import { useGetPayrollFilterOptions } from "../queries/getPayrollFilterOptions"

export function usePayrollFilterOptions() {
  const query = useGetPayrollFilterOptions()
  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}
