import { useEffect, useRef } from 'react'

import useControllerStore from '@common/hooks/useControllerStore'
import eventBus from '@common/services/event/eventBus'
import {
  BOOT_MARK,
  BOOT_PROFILE_DEADLINE,
  IS_BOOT_PROFILING_ENABLED,
  markBootOnce
} from '@mobile/services/bootProfiler'

/**
 * Marks the controller-store readiness milestones and prints the boot timeline
 * once the boot has settled. A no-op unless boot profiling is switched on.
 *
 * Reports on whichever comes first: the store reporting ready, or
 * BOOT_PROFILE_DEADLINE elapsing. The store's readiness leaves the deferred
 * controllers out, because they only start loading once the portfolio is in, which may
 * take a long time or never happen at all.
 */
const useBootProfileReport = () => {
  const { controllerStore, isReadyToLoadRoutes } = useControllerStore()
  const hasReportedRef = useRef(false)

  useEffect(() => {
    if (!isReadyToLoadRoutes || !IS_BOOT_PROFILING_ENABLED) return
    markBootOnce(BOOT_MARK.rnStoreCriticalReady)
  }, [isReadyToLoadRoutes])

  useEffect(() => {
    if (!IS_BOOT_PROFILING_ENABLED) return

    let deadlineId: ReturnType<typeof setTimeout> | null = null
    let readinessFrameId: number | null = null
    // The readiness check and the deadline can race, and only one should print.
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

      void print()
    }

    const checkNonDeferredReadiness = () => {
      readinessFrameId = null

      if (!controllerStore.isReady) return

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
      if (readinessFrameId !== null) cancelAnimationFrame(readinessFrameId)
      eventBus.removeEventListener('ctrlUpdate', onCtrlUpdate)
    }
  }, [controllerStore])
}

export default useBootProfileReport
