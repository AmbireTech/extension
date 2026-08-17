import { IS_BOOT_PROFILING_ENABLED } from './constants'
import { BootMark, BootMarkDetail, BootProfileAnchor, BootProfileRealm } from './types'

/** Monotonic clock, falling back to the wall clock in realms without `performance`. */
export const monotonicNow = (): number =>
  typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now()

/**
 * Records timestamped boot marks for one JS realm. Both the RN side and the
 * WebView worker keep their own instance; the marks are merged on the RN side via
 * the epoch timestamps, which is the only clock the two realms share.
 *
 * Every mark carries both clocks: epoch for cross-realm ordering, monotonic for
 * span durations (immune to wall-clock adjustments mid-boot).
 *
 * Every method is a no-op when `IS_BOOT_PROFILING_ENABLED` is off, so instrumented
 * call sites do not need their own guards. `measure` still runs what it wraps.
 */
export class BootMarkRecorder {
  readonly realm: BootProfileRealm

  readonly anchor: BootProfileAnchor

  #marks: BootMark[] = []

  #openSpans: Map<string, number> = new Map()

  /** Names claimed via `reserveOnce`, so a long session can't grow the mark list. */
  #reservedNames: Set<string> = new Set()

  constructor(realm: BootProfileRealm) {
    this.realm = realm
    this.anchor = { epochMs: Date.now(), monotonicMs: monotonicNow() }
  }

  mark(name: string, detail?: BootMarkDetail): void {
    if (!IS_BOOT_PROFILING_ENABLED) return
    this.#marks.push({
      realm: this.realm,
      name,
      epochMs: Date.now(),
      monotonicMs: monotonicNow(),
      detail
    })
  }

  /**
   * Records a mark whose timestamp is already known on this realm's monotonic
   * timeline (native startup timings, WebView resource timings), translating it
   * onto the shared epoch timeline.
   */
  markAtMonotonic(name: string, monotonicMs: number, detail?: BootMarkDetail): void {
    if (!IS_BOOT_PROFILING_ENABLED) return
    this.#marks.push({
      realm: this.realm,
      name,
      epochMs: this.anchor.epochMs + (monotonicMs - this.anchor.monotonicMs),
      monotonicMs,
      detail
    })
  }

  /**
   * Claims `name` for a single recording, returning `false` if it was already
   * claimed. Used for the per-controller marks, where only the first state emit
   * of each controller belongs in the boot profile.
   */
  reserveOnce(name: string): boolean {
    if (!IS_BOOT_PROFILING_ENABLED) return false
    if (this.#reservedNames.has(name)) return false
    this.#reservedNames.add(name)
    return true
  }

  startSpan(name: string): void {
    if (!IS_BOOT_PROFILING_ENABLED) return
    this.#openSpans.set(name, monotonicNow())
  }

  /** Closes a span opened with `startSpan`. A no-op if the span was never opened. */
  endSpan(name: string, detail?: BootMarkDetail): void {
    const startedAt = this.#openSpans.get(name)
    if (startedAt === undefined) return
    this.#openSpans.delete(name)
    this.mark(name, { ...detail, durationMs: monotonicNow() - startedAt })
  }

  /** Times a synchronous call and records it as a span, returning its result. */
  measure<T>(name: string, fn: () => T, detail?: BootMarkDetail): T {
    // MUST NOT BE SHORT-CIRCUITED: the fn must run even if profiling is off, so the boot path is not altered.
    this.startSpan(name)
    try {
      return fn()
    } finally {
      this.endSpan(name, detail)
    }
  }

  /** Times a promise and records it as a span, passing the settlement through. */
  async measureAsync<T>(name: string, promise: Promise<T>, detail?: BootMarkDetail): Promise<T> {
    // MUST NOT BE SHORT-CIRCUITED: the fn must run even if profiling is off, so the boot path is not altered.
    this.startSpan(name)
    try {
      return await promise
    } finally {
      this.endSpan(name, detail)
    }
  }

  getMarks(): BootMark[] {
    return this.#marks
  }
}
