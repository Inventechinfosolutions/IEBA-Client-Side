import { useQuery } from "@tanstack/react-query"

import { programKeys } from "../keys"
import { getMockPrograms } from "../mock"
import type { GetProgramsParams } from "../types"

export function useGetPrograms(params: GetProgramsParams) {
  return useQuery({
    queryKey: programKeys.list(params),
    queryFn: () => getMockPrograms(params),
  })
}
