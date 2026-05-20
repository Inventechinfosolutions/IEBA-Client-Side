/**
 * Deep equality comparison between two values.
 */
export function isDataEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;

  if (
    typeof val1 !== "object" ||
    val1 === null ||
    typeof val2 !== "object" ||
    val2 === null
  ) {
    return false;
  }

  // Handle arrays
  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    for (let i = 0; i < val1.length; i++) {
      if (!isDataEqual(val1[i], val2[i])) return false;
    }
    return true;
  }

  if (Array.isArray(val1) || Array.isArray(val2)) {
    return false;
  }

  const keys1 = Object.keys(val1);
  const keys2 = Object.keys(val2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key) || !isDataEqual(val1[key], val2[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two objects (initial and current) and returns only the fields in current
 * that differ from initial. Returns null if there are no changes.
 */
export function getChangedFields<T extends Record<string, any>>(
  initial: T,
  current: T
): Partial<T> | null {
  const diff: Partial<T> = {};

  for (const key in current) {
    if (Object.prototype.hasOwnProperty.call(current, key)) {
      if (!isDataEqual(initial[key], current[key])) {
        diff[key] = current[key];
      }
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
}
