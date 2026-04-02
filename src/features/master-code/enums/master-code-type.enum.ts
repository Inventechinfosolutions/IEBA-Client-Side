/**
 * Master-code tab / activity-code `type` values (tenant `master-codes.name`).
 * Backend Nest may still call this `ActivityCodeTypeEnum`; on the frontend this is master-code domain.
 * Erasable const object — safe with `erasableSyntaxOnly`.
 */
export const MasterCodeTypeEnum = {
  FFP: "FFP",
  MAA: "MAA",
  TCM: "TCM",
  INTERNAL: "INTERNAL",
  CDSS: "CDSS",
} as const

export type MasterCodeTypeEnum = (typeof MasterCodeTypeEnum)[keyof typeof MasterCodeTypeEnum]

const VALUES = new Set<string>(Object.values(MasterCodeTypeEnum))

export function isMasterCodeType(value: string): value is MasterCodeTypeEnum {
  return VALUES.has(value)
}
