import { useCreateJobClassification } from "../mutations/createJobClassification"
import { useUpdateJobClassification } from "../mutations/updateJobClassification"
import { useGetJobClassifications } from "../queries/getJobClassifications"
import type { GetJobClassificationsParams } from "../types"

export function useJobClassificationModule(params: GetJobClassificationsParams) {
  const query = useGetJobClassifications(params)
  const createMutation = useCreateJobClassification()
  const updateMutation = useUpdateJobClassification()

  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createJobClassification: createMutation.mutate,
    createJobClassificationAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateJobClassification: updateMutation.mutate,
    updateJobClassificationAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
