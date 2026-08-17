import {
  BOOT_MARK,
  BOOT_MARK_PREFIX,
  BOOT_PROFILE_MARKS_MESSAGE,
  BOOT_PROFILE_REALM,
  IS_BOOT_PROFILING_ENABLED
} from '@mobile/services/bootProfiler/constants'
import { BootMarkRecorder } from '@mobile/services/bootProfiler/markRecorder'
import { BootProfilePayload } from '@mobile/services/bootProfiler/types'

// Boot profiler for the WebView worker realm. The worker webpack entry lists this
// module ahead of injectedLogic.ts so the mark below lands before the controller
// module graph is evaluated, which means this file must only import the
// dependency-free bootProfiler siblings — no richJson, no controllers, nothing that
// would run ahead of the structuredClone shim.

export const workerBootProfiler = new BootMarkRecorder(BOOT_PROFILE_REALM.worker)

workerBootProfiler.mark(BOOT_MARK.workerBundleEvalStart)

/**
 * Adds the WebView's own navigation and resource timings, which is what splits
 * "WebView spawn + HTML load + bundle fetch" into real numbers instead of one
 * opaque gap. Populated by the WebView engine, so entries may be missing for
 * `file://` or cross-origin loads — absent entries simply drop out of the report.
 */
const collectPageTimings = () => {
  // Stamped by the inline script the HTML places right before the bundle <script>
  // tag (see WorkerHtmlPlugin). Absent in dev, whose HTML admits no inline script.
  const bundleTagReachedAt = (globalThis as any).__ambireBundleTagReachedAt
  if (typeof bundleTagReachedAt === 'number') {
    workerBootProfiler.markAtMonotonic(BOOT_MARK.workerPageBundleTagReached, bundleTagReachedAt)
  }

  const pagePerformance = globalThis.performance
  if (typeof pagePerformance?.getEntriesByType !== 'function') return

  const [navigation] = pagePerformance.getEntriesByType('navigation') as any[]
  if (navigation) {
    workerBootProfiler.markAtMonotonic(`${BOOT_MARK_PREFIX.workerPage}navigationStart`, 0, {
      note: navigation.name
    })
    // Zero means "the event has not fired", not "it happened at navigation start".
    const navigationTimings: [string, number | undefined][] = [
      ['htmlResponseEnd', navigation.responseEnd],
      ['domContentLoaded', navigation.domContentLoadedEventEnd],
      ['loadEventEnd', navigation.loadEventEnd]
    ]
    navigationTimings.forEach(([name, value]) => {
      if (!value) return
      workerBootProfiler.markAtMonotonic(`${BOOT_MARK_PREFIX.workerPage}${name}`, value)
    })
  }

  const resources = pagePerformance.getEntriesByType('resource') as any[]
  resources
    .filter((entry) => entry.name.includes('webview-bundle.js'))
    .forEach((entry) => {
      workerBootProfiler.markAtMonotonic(
        `${BOOT_MARK_PREFIX.workerPage}bundleFetchStart`,
        entry.startTime
      )
      workerBootProfiler.markAtMonotonic(
        `${BOOT_MARK_PREFIX.workerPage}bundleFetchEnd`,
        entry.responseEnd,
        {
          durationMs: entry.duration,
          // Both are 0 for cross-origin responses without Timing-Allow-Origin,
          // which is the dev-server case.
          bytes: entry.encodedBodySize || entry.transferSize || undefined
        }
      )
    })
}

/**
 * Ships every worker mark to the RN side, which owns assembling and printing the
 * report. Posted as untagged JSON (see bridgeCodec) so this module does not have
 * to pull richJson in ahead of the structuredClone shim.
 */
export const flushWorkerBootProfile = () => {
  if (!IS_BOOT_PROFILING_ENABLED) return
  if (!window.ReactNativeWebView) return

  collectPageTimings()

  const payload: BootProfilePayload = {
    realm: BOOT_PROFILE_REALM.worker,
    anchor: workerBootProfiler.anchor,
    marks: workerBootProfiler.getMarks()
  }

  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: BOOT_PROFILE_MARKS_MESSAGE, payload })
  )
}
