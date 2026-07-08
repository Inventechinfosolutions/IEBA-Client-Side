/**
 * Formats a raw time string as it is typed by the user.
 * - Auto-inserts a colon if 3 or 4 digits are typed (e.g. 1234 -> 12:34).
 * - Restricts the hour part to a maximum of 23.
 * - Restricts the minute part to a maximum of 59.
 */
export const formatTimeInput = (val: string): string => {
  if (!val) return ""

  let tempVal = val
  if (!tempVal.includes(":")) {
    const cleanedDigits = tempVal.replace(/\D/g, "")
    if (cleanedDigits.length >= 3) {
      tempVal = cleanedDigits.slice(0, 2) + ":" + cleanedDigits.slice(2, 4)
    }
  }

  if (tempVal.includes(":")) {
    const parts = tempVal.split(":")
    let hourPart = parts[0].replace(/\D/g, "")
    let minutePart = parts[1].replace(/\D/g, "")

    if (hourPart.length === 2) {
      const hVal = parseInt(hourPart, 10)
      if (hVal > 23) {
        hourPart = "23"
      }
    } else if (hourPart.length > 2) {
      hourPart = hourPart.slice(0, 2)
      const hVal = parseInt(hourPart, 10)
      if (hVal > 23) {
        hourPart = "23"
      }
    }

    if (minutePart.length === 2) {
      const mVal = parseInt(minutePart, 10)
      if (mVal > 59) {
        minutePart = "59"
      }
    } else if (minutePart.length > 2) {
      minutePart = minutePart.slice(0, 2)
      const mVal = parseInt(minutePart, 10)
      if (mVal > 59) {
        minutePart = "59"
      }
    }

    if (parts[1] === "" && val.endsWith(":")) {
      return `${hourPart}:`
    }
    return `${hourPart}:${minutePart}`
  } else {
    let hourPart = tempVal.replace(/\D/g, "")
    if (hourPart.length === 2) {
      const hVal = parseInt(hourPart, 10)
      if (hVal > 23) {
        hourPart = "23"
      }
    }
    return hourPart
  }
}

/**
 * Normalizes a time string on blur to ensure it is in full HH:MM format.
 * Pads hours/minutes and validates constraints.
 */
export const normalizeTimeOnBlur = (val: string): string => {
  if (!val) return ""

  const parts = val.split(":")
  let hour = parts[0] || "0"
  let minute = parts[1] || "00"

  hour = hour.padStart(2, "0")
  minute = minute.padEnd(2, "0")

  let hVal = parseInt(hour, 10)
  if (isNaN(hVal) || hVal > 23) {
    hour = "23"
  }
  let mVal = parseInt(minute, 10)
  if (isNaN(mVal) || mVal > 59) {
    minute = "59"
  }

  return `${hour}:${minute}`
}
