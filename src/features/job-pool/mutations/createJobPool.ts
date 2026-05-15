import { useMutation, useQueryClient } from "@tanstack/react-query"

import { jobPoolKeys } from "../keys"
import { createJobPool } from "../api/jobpool"
import type { CreateJobPoolInput, JobPoolRow } from "../types"

export function useCreateJobPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateJobPoolInput): Promise<JobPoolRow> =>
      createJobPool(input.values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: jobPoolKeys.lists(),
      })
    },
  })
}
