import { useEffect, useRef } from 'react'

import useControllerStore from '@common/hooks/useControllerStore'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import {
  BOOT_MARK,
  BOOT_PROFILE_DEADLINE,
  BOOT_PROFILE_MARKS_EVENT,
  BOOT_PROFILE_WORKER_FLUSH_TIMEOUT,
  IS_BOOT_PROFILING_ENABLED,
  markBootOnce
} from '@mobile/services/bootProfiler'

/**
 * Marks the controller-store readiness milestones and, once the boot has settled,
 * asks the WebView worker for its marks and prints the assembled two-realm
 * timeline. A no-op unless boot profiling is switched on.
 *
 * Reports on whichever comes first: every controller state having landed, or
 * BOOT_PROFILE_DEADLINE elapsing.
 */
const useBootProfileReport = (
  dispatch: (action: MethodAction | Action, windowId?: number, raw?: boolean) => void
) => {
  const { isStoreReady, isReadyToLoadRoutes } = useControllerStore()
  const hasReportedRef = useRef(false)

  useEffect(() => {
    if (!isReadyToLoadRoutes || !IS_BOOT_PROFILING_ENABLED) return
    markBootOnce(BOOT_MARK.rnStoreCriticalReady)
  }, [isReadyToLoadRoutes])

  useEffect(() => {
    if (!isStoreReady || !IS_BOOT_PROFILING_ENABLED) return
    markBootOnce(BOOT_MARK.rnStoreAllReady)
  }, [isStoreReady])

  useEffect(() => {
    if (!IS_BOOT_PROFILING_ENABLED) return

    let deadlineId: ReturnType<typeof setTimeout> | null = null
    let workerFlushId: ReturnType<typeof setTimeout> | null = null
    let reportFrameId: number | null = null
    let removeWorkerMarksListener: (() => void) | null = null
    // The worker's marks arriving and the flush timeout firing can race, and only
    // one of them should print.
    let hasPrinted = false

    const print = async () => {
      if (hasPrinted) return
      hasPrinted = true

      // The report module pulls in expo-file-system, so it is loaded only now —
      // after the boot it measures is over.
      const { buildBootReport, writeBootProfileJson } = await import(
        '@mobile/services/bootProfiler/bootReport'
      )

      console.log(buildBootReport())

      const path = await writeBootProfileJson()
      if (path) console.log(`[bootProfiler] raw marks written to ${path}`)
    }

    const report = () => {
      if (hasReportedRef.current) return
      hasReportedRef.current = true

      const onWorkerMarks = () => {
        if (workerFlushId) clearTimeout(workerFlushId)
        workerFlushId = null
        void print()
      }

      eventBus.addEventListener(BOOT_PROFILE_MARKS_EVENT, onWorkerMarks)
      removeWorkerMarksListener = () =>
        eventBus.removeEventListener(BOOT_PROFILE_MARKS_EVENT, onWorkerMarks)

      dispatch({ type: 'FLUSH_BOOT_PROFILE' })
      // Print without the worker's half rather than never printing at all — a
      // worker that cannot answer is itself the finding.
      workerFlushId = setTimeout(() => {
        workerFlushId = null
        void print()
      }, BOOT_PROFILE_WORKER_FLUSH_TIMEOUT)
    }

    deadlineId = setTimeout(report, BOOT_PROFILE_DEADLINE)

    // Report a frame after the last state landed, so building the report never
    // lands inside the boot it is measuring.
    if (isStoreReady) reportFrameId = requestAnimationFrame(report)

    return () => {
      if (deadlineId) clearTimeout(deadlineId)
      if (workerFlushId) clearTimeout(workerFlushId)
      // Must be cancelled too: a frame that fires after cleanup would run `report`,
      // which adds an event listener and a timeout that nothing is left to remove.
      if (reportFrameId !== null) cancelAnimationFrame(reportFrameId)
      removeWorkerMarksListener?.()
    }
  }, [isStoreReady, dispatch])
}

export default useBootProfileReport
