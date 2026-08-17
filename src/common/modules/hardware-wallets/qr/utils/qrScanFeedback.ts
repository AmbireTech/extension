/**
 * What the user has to do for the scan to make progress. Derived from the codes that were
 * read, so it can only tell a code apart from the frame it sits in once one was decoded.
 */
export type QrScanFeedback = 'searching' | 'move-closer' | 'move-back' | 'hold-still' | 'lost'

export type QrScanProgress = {
  feedback: QrScanFeedback
  /**
   * How many fragments the payload being scanned is made of, which together with the pace
   * the other device shows them at is how long the whole scan takes. 0 until the first
   * fragment is read, and unchanged for the rest of the scan afterwards.
   */
  expectedParts: number
}

/** The last code that was read, which is all the feedback is worked out from */
export type QrScanLastRead = {
  /** How many codes were read since the scanner started */
  count: number
  /** When the last one was read */
  at: number
  /** How much of the scanned area it covered, 0 when the scanner did not say */
  coverage: number
}

/**
 * How often the feedback is re-evaluated, decoupled from the scan rate so that it is not
 * recomputed for every single camera frame.
 */
export const QR_SCAN_FEEDBACK_INTERVAL = 500

// A code was read this long ago at most, otherwise the camera is considered to have lost it
const LAST_READ_TIMEOUT = 1200
/**
 * The scanned area is downscaled before decoding (to 400x400 on web), so a code covering
 * less than this much of it has under 3 pixels per module at the sizes the accounts sync
 * uses - too little for the decoder to tell the modules apart reliably.
 */
const MIN_COVERAGE = 0.35
// Any bigger and the code is about to grow out of the scanned area, which fails every frame
const MAX_COVERAGE = 0.9

export const emptyQrScanLastRead = (): QrScanLastRead => ({ count: 0, at: 0, coverage: 0 })

/**
 * The share of the scanned area a code takes up, from the corner points the scanner
 * reports and the size of the area it looks for codes in (both in the same units).
 * 0 when the platform reported no corner points, which not all of them do.
 */
export const getQrCodeCoverage = (
  cornerPoints: { x: number; y: number }[] | undefined,
  scannedSpan: number
) => {
  if (!cornerPoints?.length || !scannedSpan) return 0

  const xs = cornerPoints.map(({ x }) => x)
  const ys = cornerPoints.map(({ y }) => y)
  const codeSpan = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))

  return codeSpan / scannedSpan
}

export const getQrScanFeedback = ({ count, at, coverage }: QrScanLastRead): QrScanFeedback => {
  if (!count) return 'searching'

  // The code stopped being readable, which at this size usually means it grew out of the
  // scanned area - otherwise there is no telling why, so the user is only told it is gone
  if (Date.now() - at > LAST_READ_TIMEOUT) return coverage > MAX_COVERAGE ? 'move-back' : 'lost'

  // Without corner points there is no telling how big the code is, so the user is left to
  // hold the phone where it evidently works
  if (!coverage) return 'hold-still'

  if (coverage < MIN_COVERAGE) return 'move-closer'
  if (coverage > MAX_COVERAGE) return 'move-back'

  return 'hold-still'
}
