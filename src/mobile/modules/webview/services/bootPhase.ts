import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'

import { sendToReactEvent } from './webviewLogger'

// Boot phase controls which controllers may stream their state to the RN side.
// On mobile the splash hides as soon as the routing-critical controllers land;
// the heavy ones (portfolio, dapps, activity, ...) are deferred until the RN
// side flips this phase to 'full' via the SET_BOOT_PHASE action so the heavy
// stringify+bridge+parse cost does not contend with the first paint of the
// unlock/dashboard screen. On platforms that don't send `criticalControllers`
// in the init config, the critical set is empty → every controller is treated
// as critical → original (non-deferred) behavior is preserved.
let bootPhase: 'critical' | 'full' = 'critical'
let criticalControllerSet: Set<string> = new Set()
// Latest queued state per deferred controller — multiple emits in the critical
// phase collapse to the most recent state, exactly like the per-tick debounce
// already does for non-deferred controllers.
const deferredCtrlPayloads: Map<string, { ctrl: any; forceEmit?: boolean }> = new Map()

export function setCriticalControllers(controllers: string[]) {
  criticalControllerSet = new Set<string>(controllers)
}

export function isCriticalController(ctrlName: string) {
  return criticalControllerSet.has(ctrlName)
}

export function getBootPhase() {
  return bootPhase
}

export function queueDeferredCtrlPayload(ctrlName: string, ctrl: any, forceEmit?: boolean) {
  deferredCtrlPayloads.set(ctrlName, { ctrl, forceEmit })
}

function buildStateForFE(ctrlName: string, ctrl: any) {
  const stateToSendToFE = ctrl.toJSON()

  if (ctrlName === 'MainController') {
    // We are removing the state of the nested controllers in main to avoid the CPU-intensive task of parsing + stringifying.
    // We should access the state of the nested controllers directly from their context instead of accessing them through the main ctrl state on the FE.
    Object.keys(controllersNestedInMainMapping).forEach((nestedCtrlName) => {
      delete (stateToSendToFE as any)[nestedCtrlName]
    })
  }

  return stateToSendToFE
}

// Called by the SET_BOOT_PHASE action once the RN side has hidden the splash
// and is ready to absorb the heavy controller payloads. Drains the deferred
// queue across microtasks so the bridge isn't flooded by a single sync burst.
export function setBootPhase(phase: 'critical' | 'full') {
  if (phase === bootPhase) return
  bootPhase = phase

  if (phase !== 'full' || deferredCtrlPayloads.size === 0) return

  const entries = Array.from(deferredCtrlPayloads.entries())
  deferredCtrlPayloads.clear()

  entries.forEach(([ctrlName, { ctrl, forceEmit }], index) => {
    setTimeout(() => {
      try {
        sendToReactEvent('ctrl.update', {
          ctrlName,
          state: buildStateForFE(ctrlName, ctrl),
          forceEmit
        })
      } catch (err) {
        ;(err as any).controllerName = ctrlName
        console.error('Debug: Failed to drain deferred update for ctrl', ctrlName, err)
        sendToReactEvent('ctrl.error', {
          ctrlName,
          errors: [{ message: (err as any).message, stack: (err as any).stack }]
        })
      }
    }, index)
  })
}

export { buildStateForFE }
