/**
 * `m:ss` for a running scan or withdrawal. The elapsed time is the only progress signal there is -
 * neither the SDK's sync nor its prover reports anything while it works - so it is what tells a
 * slow run from a stuck one.
 */
const formatElapsed = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export { formatElapsed }
