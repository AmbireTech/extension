import { BOOT_PROFILE_REALM } from './constants'

export type BootProfileRealm = (typeof BOOT_PROFILE_REALM)[keyof typeof BOOT_PROFILE_REALM]

export type BootMarkDetail = {
  /** Wall time the span this mark closes took. Absent for point-in-time marks. */
  durationMs?: number
  /** Size of the bridge payload the mark refers to, in bytes. */
  bytes?: number
  /** Free-form count (storage keys seeded, controllers drained, ...). */
  count?: number
  /** Short human note rendered next to the mark in the report. */
  note?: string
}

export type BootMark = {
  realm: BootProfileRealm
  name: string
  /** Wall clock, the only timeline the RN and worker realms share. */
  epochMs: number
  /** Monotonic clock of the recording realm. Used for span durations. */
  monotonicMs: number
  detail?: BootMarkDetail
}

/**
 * Epoch/monotonic pair sampled at the same instant. Lets timings that only exist
 * on a monotonic timeline (RN's native startup marks, the WebView's navigation
 * and resource timings) be placed on the shared epoch timeline.
 */
export type BootProfileAnchor = {
  epochMs: number
  monotonicMs: number
}

export type BootProfilePayload = {
  realm: BootProfileRealm
  anchor: BootProfileAnchor
  marks: BootMark[]
}
