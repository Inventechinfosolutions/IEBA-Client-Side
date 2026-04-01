import { useMutation } from "@tanstack/react-query"

import { changeCounty } from "../api/changeCounty"
import type { ChangeCountyBody, ChangeCountyResult } from "../types"
import { authKeys } from "../keys"

export function useChangeCounty() {
  return useMutation<ChangeCountyResult, Error, ChangeCountyBody>({
    mutationKey: authKeys.changeCounty(),
    mutationFn: changeCounty,
  })
}

