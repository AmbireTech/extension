const ONE_SECOND_MS = 1000

/**
 * Whole seconds left until `closesAt`, rounded up so a countdown reads 5, 4, ... 1.
 * Never below 1, as the request closes when the last second runs out
 */
const getSecondsUntilClose = (closesAt: number, now: number) =>
  Math.max(1, Math.ceil((closesAt - now) / ONE_SECOND_MS))

/**
 * Time until `getSecondsUntilClose` drops by one second
 */
const getMsUntilNextSecond = (closesAt: number, now: number) => {
  const msLeftInCurrentSecond = (closesAt - now) % ONE_SECOND_MS

  return msLeftInCurrentSecond > 0 ? msLeftInCurrentSecond : ONE_SECOND_MS
}

export { getMsUntilNextSecond, getSecondsUntilClose }
