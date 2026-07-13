/**
 * Formats an integer with spaces every three digits (e.g. 19349 → "19 349").
 */
export function formatIntegerWithSpaceThousands(value: number): string {
  const sign = value < 0 ? '-' : ''
  let digits = String(Math.floor(Math.abs(value)))
  const groups: string[] = []

  while (digits.length > 3) {
    groups.unshift(digits.slice(-3))
    digits = digits.slice(0, -3)
  }
  groups.unshift(digits)

  return sign + groups.join(' ')
}
