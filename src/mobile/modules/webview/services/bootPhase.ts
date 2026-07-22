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

// Set of controllers the UI currently has an active subscriber for. Until the
// UI sends its first SET_SUBSCRIBED_CONTROLLERS, this gate stays inactive and
// every controller streams as before (no suppression during the boot window
// before the middleware has wired up the subscription reporting).
let hasReceivedSubscriptionSet = false
let subscribedControllerSet: Set<string> = new Set()
// Latest queued state per suppressed (unsubscribed, non-critical) controller —
// same collapse-to-latest semantics as the deferred queue. Drained the moment
// a controller gains a subscriber so the UI never renders stale state.
const suppressedCtrlPayloads: Map<string, { ctrl: any; forceEmit?: boolean }> = new Map()

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

// `true` once the UI has reported its subscription set at least once. While
// `false`, the subscription gate is inactive and nothing is suppressed.
export function isSubscriptionGateActive() {
  return hasReceivedSubscriptionSet
}

export function isControllerSubscribed(ctrlName: string) {
  return subscribedControllerSet.has(ctrlName)
}

export function queueSuppressedCtrlPayload(ctrlName: string, ctrl: any, forceEmit?: boolean) {
  suppressedCtrlPayloads.set(ctrlName, { ctrl, forceEmit })
}

function buildStateForFE(ctrlName: string, ctrl: any) {
  const stateToSendToFE = ctrl.toJSON()

  if (ctrlName === 'MainController') {
    // We are removing the state of the nested controllers in main to avoid the CPU-intensive task of parsing + stringifying.
    // We should access the state of the nested controllers directly from their context instead of accessing them through the main ctrl state on the FE.
    controllersNestedInMainMapping.forEach((nestedCtrlName) => {
      delete (stateToSendToFE as any)[nestedCtrlName]
    })
  }

  return stateToSendToFE
}

// Drains queued controller payloads to the RN side one per macrotask so the
// bridge isn't flooded by a single synchronous burst. Uses a self-rescheduling
// chain (one pending timer at a time) rather than scheduling every entry up
// front, so the queue can't build a backlog of timers regardless of its size.
function drainCtrlPayloads(entries: [string, { ctrl: any; forceEmit?: boolean }][]) {
  let index = 0

  const drainNext = () => {
    const entry = entries[index]
    index += 1
    if (!entry) return
    const [ctrlName, { ctrl, forceEmit }] = entry

    try {
      sendToReactEvent('ctrl.update', {
        ctrlName,
        state: buildStateForFE(ctrlName, ctrl),
        forceEmit
      })
    } catch (err) {
      ;(err as any).controllerName = ctrlName
      console.error('Debug: Failed to drain queued update for ctrl', ctrlName, err)
      sendToReactEvent('ctrl.error', {
        ctrlName,
        errors: [{ message: (err as any).message, stack: (err as any).stack }]
      })
    }

    if (index < entries.length) setTimeout(drainNext, 0)
  }

  if (entries.length > 0) setTimeout(drainNext, 0)
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
  drainCtrlPayloads(entries)
}

// Called by the SET_SUBSCRIBED_CONTROLLERS action whenever the set of
// controllers the UI is displaying changes. Activates the gate on first call,
// then flushes the latest queued state of every controller that just gained a
// subscriber so the UI never renders stale state for a freshly opened screen.
export function setSubscribedControllers(controllers: string[]) {
  const nextSet = new Set(controllers)

  const newlySubscribed = controllers.filter(
    (ctrlName) => !subscribedControllerSet.has(ctrlName) && suppressedCtrlPayloads.has(ctrlName)
  )

  subscribedControllerSet = nextSet
  hasReceivedSubscriptionSet = true

  if (newlySubscribed.length === 0) return

  const entries = newlySubscribed.map((ctrlName) => {
    const payload = suppressedCtrlPayloads.get(ctrlName)!
    suppressedCtrlPayloads.delete(ctrlName)
    return [ctrlName, payload] as [string, { ctrl: any; forceEmit?: boolean }]
  })
  drainCtrlPayloads(entries)
}

export { buildStateForFE }
