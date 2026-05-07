import { useCreateProgram } from "../mutations/createProgram"
import { useUpdateProgram } from "../mutations/updateProgram"
import { useGetPrograms } from "../queries/getPrograms"
import type { GetProgramsParams } from "../types"

export function useProgramModule(params: GetProgramsParams) {
  const query = useGetPrograms(params)
  const createMutation = useCreateProgram()
  const updateMutation = useUpdateProgram()

  return {
    rows: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createProgram: createMutation.mutate,
    createProgramAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    updateProgram: updateMutation.mutate,
    updateProgramAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
