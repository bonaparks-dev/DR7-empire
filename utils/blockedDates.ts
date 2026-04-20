/**
 * Shared holiday/blocked date logic for all date pickers.
 * Sundays + Italian public holidays are blocked.
 */

const FIXED_HOLIDAYS = [
  '01-01', '06-01', '25-04', '01-05', '02-06', '15-08', '01-11', '08-12', '25-12', '26-12',
]

const VARIABLE_HOLIDAYS = [
  '2024-03-31', '2024-04-01', // Easter 2024
  '2025-04-20', '2025-04-21', // Easter 2025
  '2026-04-05', '2026-04-06', // Easter 2026
  '2027-03-28', '2027-03-29', // Easter 2027
  '2028-04-16', '2028-04-17', // Easter 2028
]

export function isBlockedDate(date: Date): boolean {
  if (date.getDay() === 0) return true // Sunday
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  if (FIXED_HOLIDAYS.includes(`${dd}-${mm}`)) return true
  if (VARIABLE_HOLIDAYS.includes(`${yyyy}-${mm}-${dd}`)) return true
  return false
}

export function isBlockedDateString(dateStr: string): boolean {
  if (!dateStr) return false
  return isBlockedDate(new Date(dateStr + 'T12:00:00'))
}
