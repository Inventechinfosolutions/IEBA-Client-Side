/** Mirrors backend `userrelationship.enum.ts` — emergency contact relationship wire values. */
export const UserRelationship = {
  FATHER: "father",
  MOTHER: "mother",
  BROTHER: "brother",
  SISTER: "sister",
  SPOUSE: "spouse",
  OTHER: "other",
} as const

export type UserRelationship = (typeof UserRelationship)[keyof typeof UserRelationship]

/** Profile UI order for the relationship `<Select>`. */
export const RELATIONSHIP_OPTIONS: readonly UserRelationship[] = [
  UserRelationship.BROTHER,
  UserRelationship.FATHER,
  UserRelationship.MOTHER,
  UserRelationship.OTHER,
  UserRelationship.SISTER,
  UserRelationship.SPOUSE,
]
