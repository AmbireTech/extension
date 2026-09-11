import { useEffect, useRef } from 'react'

import useControllerStore from '@common/hooks/useControllerStore'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import { MOBILE_DEFERRED_CONTROLLERS } from '@mobile/constants/criticalControllers'
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
 * Reports on whichever comes first: every non-deferred controller state having
 * landed, or BOOT_PROFILE_DEADLINE elapsing. The deferred controllers are left out
 * because they only start loading after unlock, which may take a long time or never
 * happen at all.
 */
const useBootProfileReport = (
  dispatch: (action: MethodAction | Action, windowId?: number, raw?: boolean) => void
) => {
  const { controllerStore, isReadyToLoadRoutes } = useControllerStore()
  const hasReportedRef = useRef(false)

  useEffect(() => {
    if (!isReadyToLoadRoutes || !IS_BOOT_PROFILING_ENABLED) return
    markBootOnce(BOOT_MARK.rnStoreCriticalReady)
  }, [isReadyToLoadRoutes])

  useEffect(() => {
    if (!IS_BOOT_PROFILING_ENABLED) return

    let deadlineId: ReturnType<typeof setTimeout> | null = null
    let workerFlushId: ReturnType<typeof setTimeout> | null = null
    let readinessFrameId: number | null = null
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

    const checkNonDeferredReadiness = () => {
      readinessFrameId = null

      const nonDeferredControllers = controllerStore.controllersByName.filter(
        (ctrlName) => !MOBILE_DEFERRED_CONTROLLERS.includes(ctrlName)
      )
      if (!nonDeferredControllers.length) return
      if (!controllerStore.areControllersReady(nonDeferredControllers)) return

      markBootOnce(BOOT_MARK.rnStoreNonDeferredReady)
      eventBus.removeEventListener('ctrlUpdate', onCtrlUpdate)
      report()
    }

    // The store is written by a listener on this same event that lives in the parent
    // provider, so the check has to wait a frame for the state it reads. Waiting also
    // keeps building the report out of the boot it is measuring.
    function onCtrlUpdate() {
      if (readinessFrameId !== null) return
      readinessFrameId = requestAnimationFrame(checkNonDeferredReadiness)
    }

    eventBus.addEventListener('ctrlUpdate', onCtrlUpdate)
    // Covers the case where the last state already landed before this effect ran.
    onCtrlUpdate()

    deadlineId = setTimeout(report, BOOT_PROFILE_DEADLINE)

    return () => {
      if (deadlineId) clearTimeout(deadlineId)
      if (workerFlushId) clearTimeout(workerFlushId)
      // Must be cancelled too: a frame that fires after cleanup would run `report`,
      // which adds an event listener and a timeout that nothing is left to remove.
      if (readinessFrameId !== null) cancelAnimationFrame(readinessFrameId)
      eventBus.removeEventListener('ctrlUpdate', onCtrlUpdate)
      removeWorkerMarksListener?.()
    }
  }, [controllerStore, dispatch])
}

export default useBootProfileReport
