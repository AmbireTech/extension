import type { SerializedStorageSnapshot } from '@common/services/storage/types'

import {
  BOOT_MARK,
  BOOT_MARK_PREFIX,
  BOOT_PROFILE_REALM,
  IS_BOOT_PROFILING_ENABLED,
  STORAGE_KEY_NOT_SNAPSHOTTED
} from './constants'
import { BootMarkRecorder, monotonicNow } from './markRecorder'
import { BootMark, BootMarkDetail, BootProfilePayload } from './types'

// This module is imported by the very first line of the RN bundle so the entry
// mark below is stamped before any shim, polyfill or Sentry init runs. Keep its
// import graph limited to the dependency-free siblings — pulling in
// `react-native` or `@env` here would run them ahead of the shims.

export const bootProfiler = new BootMarkRecorder(BOOT_PROFILE_REALM.rn)

bootProfiler.mark(BOOT_MARK.rnJsEntry)

/** Marks received from the WebView worker realm. Replaced wholesale on each flush. */
let workerPayload: BootProfilePayload | null = null

export const setWorkerBootProfile = (payload: BootProfilePayload) => {
  workerPayload = payload
}

type ReactNativeStartupTiming = {
  startTime?: number | null
  endTime?: number | null
  initializeRuntimeStart?: number | null
  initializeRuntimeEnd?: number | null
  executeJavaScriptBundleEntryPointStart?: number | null
  executeJavaScriptBundleEntryPointEnd?: number | null
}

/**
 * Reads RN's built-in native startup timings and returns them as marks on the
 * shared epoch timeline. These cover everything before the first line of JS —
 * process start, runtime init, bundle evaluation.
 *
 * Returns an empty list when the platform does not populate them (the values come
 * from native `ReactMarker` calls and are not guaranteed on every platform or
 * under a JS debugger), in which case the pre-JS window has to be measured with
 * platform tooling instead. See the profiling notes in this folder's README.
 */
const collectNativeStartupMarks = (): BootMark[] => {
  const timing: ReactNativeStartupTiming | undefined = (globalThis as any).performance
    ?.rnStartupTiming

  if (!timing) return []

  const nativeRecorder = new BootMarkRecorder(BOOT_PROFILE_REALM.native)
  const fields: [string, number | null | undefined][] = [
    [BOOT_MARK.nativeStartTime, timing.startTime],
    [BOOT_MARK.nativeRuntimeInitStart, timing.initializeRuntimeStart],
    [BOOT_MARK.nativeRuntimeInitEnd, timing.initializeRuntimeEnd],
    [BOOT_MARK.nativeBundleEvalStart, timing.executeJavaScriptBundleEntryPointStart],
    [BOOT_MARK.nativeBundleEvalEnd, timing.executeJavaScriptBundleEntryPointEnd]
  ]

  fields.forEach(([name, value]) => {
    if (typeof value !== 'number') return
    nativeRecorder.markAtMonotonic(name, value)
  })

  return nativeRecorder.getMarks()
}

/** Every mark from every realm, ordered by wall clock. */
export const getAllBootMarks = (): BootMark[] =>
  [
    ...collectNativeStartupMarks(),
    ...bootProfiler.getMarks(),
    ...(workerPayload?.marks ?? [])
  ].sort((a, b) => a.epochMs - b.epochMs)

export { monotonicNow }

export const markBoot = (name: string, detail?: BootMarkDetail) => bootProfiler.mark(name, detail)

/**
 * Records `name` the first time only. For marks that sit on a render path, where
 * a later re-render must not append to the timeline.
 */
export const markBootOnce = (name: string, detail?: BootMarkDetail) => {
  if (bootProfiler.reserveOnce(name)) bootProfiler.mark(name, detail)
}

/**
 * Records the wire size of every key in the init storage snapshot, so the report
 * can say which keys make up the payload the worker has to receive and parse
 * before it can construct a single controller.
 *
 * Sizes are string lengths, the same unit the bridge payload marks use, so the
 * per-key numbers add up against `rn.initPayload.encoded`. Keys held out of the
 * snapshot are marked too, without a size (reading them to measure would cost as
 * much as shipping them), so the report still shows they exist and are deferred.
 */
export const markStorageSnapshotKeys = (snapshot: SerializedStorageSnapshot) => {
  if (!IS_BOOT_PROFILING_ENABLED) return

  Object.entries(snapshot.values).forEach(([key, serialized]) => {
    markBoot(`${BOOT_MARK_PREFIX.rnStorageKey}${key}`, { bytes: serialized.length })
  })

  snapshot.allKeys
    .filter((key) => snapshot.values[key] === undefined)
    .forEach((key) => {
      markBoot(`${BOOT_MARK_PREFIX.rnStorageKey}${key}`, { note: STORAGE_KEY_NOT_SNAPSHOTTED })
    })
}

/**
 * Records the splash hide plus the frame that follows it, which is the closest JS
 * can get to when the user actually sees the first screen.
 */
export const markSplashHidden = () => {
  markBootOnce(BOOT_MARK.rnSplashHidden)
  requestAnimationFrame(() => markBootOnce(BOOT_MARK.rnFirstPaint))
}
