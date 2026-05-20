import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { updateJobPool } from "../api/jobpool"
import type { UpdateJobPoolInput, JobPoolRow } from "../types"

export function useUpdateJobPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateJobPoolInput): Promise<JobPoolRow> =>
      updateJobPool(input.id, input.values, input.initialValues),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobPoolKeys.lists(),
      })
    },
  })
}
