import { 
  endOfQuarter, 
  format, 
  addDays, 
  getWeek,
  getYear,
  startOfQuarter
} from 'date-fns'

/**
 * Generates bi-weekly periods for a given fiscal year and quarter.
 * Fiscal years start in July (Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun).
 */
export function getWeeksForQuarter(fiscalYear: string, quarter: string) {
  if (!fiscalYear || !quarter) return []

  const years = fiscalYear.split("-").map(Number)
  if (years.length !== 2) return []
  const [y1, y2] = years
  
  let startMonth = 0
  let baseYear = y1
  
  if (quarter === "Qtr-1") { startMonth = 6; baseYear = y1; }
  else if (quarter === "Qtr-2") { startMonth = 9; baseYear = y1; }
  else if (quarter === "Qtr-3") { startMonth = 0; baseYear = y2; }
  else if (quarter === "Qtr-4") { startMonth = 3; baseYear = y2; }
  
  const qStart = new Date(baseYear, startMonth, 1)
  const qEnd = endOfQuarter(qStart)
  
  const weeks: { value: string; label: string }[] = []
  let curr = qStart
  
  while (curr < qEnd) {
    const biWeekStart = curr
    let biWeekEnd = addDays(biWeekStart, 13)
    
    // Don't go past the quarter end for the label/range logic if needed, 
    // but usually bi-weeks can span months.
    
    const w1 = getWeek(biWeekStart)
    const w2 = getWeek(biWeekEnd)
    const year1 = getYear(biWeekStart)
    const year2 = getYear(biWeekEnd)
    
    const label = `${year1}-${formatNumberWithSuffix(w1)} -> ${year2}-${formatNumberWithSuffix(w2)}`
    
    // Value is a pipe-separated date range for easy parsing in the form
    weeks.push({
      value: `${format(biWeekStart, 'yyyy-MM-dd')}|${format(biWeekEnd, 'yyyy-MM-dd')}`,
      label,
    })
    
    curr = addDays(curr, 14)
  }
  
  return weeks
}

function formatNumberWithSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
