import { z } from "zod"

import type { PersonalTimeStudyFilterFormValues } from "./types"

export const personalTimeStudyFilterFormSchema = z.object({
  search: z.string().trim(),
})

export const personalTimeStudyFilterDefaultValues: PersonalTimeStudyFilterFormValues =
  {
    search: "",
  }
