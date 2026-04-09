/**
 * Turns raw API / DB errors from RMTS group mutations into toast-friendly copy.
 * MySQL FK failures on `rmtsusergroup.groupId` surface as long constraint messages.
 */
export function formatRmtsGroupMutationError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong"
  const lower = raw.toLowerCase()
  if (
    lower.includes("foreign key constraint") ||
    lower.includes("cannot delete or update a parent row") ||
    lower.includes("rmtsusergroup")
  ) {
    return (
      "This group still has members linked in the system. " +
      "Remove all members from the group, then try again."
    )
  }
  return raw
}
