import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'
import { bootProfiler } from '@mobile/services/bootProfiler/bootProfiler'
import { BOOT_MARK, BOOT_MARK_PREFIX } from '@mobile/services/bootProfiler/constants'

import { emitCtrlError, emitCtrlUpdate } from './uiEvents'

// Boot phase controls which controllers may stream their state to the UI.
// On mobile the splash hides as soon as the routing-critical controllers land;
// the heavy ones (portfolio, dapps, activity, ...) are deferred until the UI
// flips this phase to 'full' via the SET_BOOT_PHASE action so the heavy
// serialize+render cost does not contend with the first paint of the
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
// Controllers whose `isReady: true` has already reached the UI. The UI's store gates
// its own readiness on that flag, so the emit carrying it must never be suppressed.
const ctrlsWithDeliveredReadiness: Set<string> = new Set()
// Controllers whose state has been streamed to the UI at least once. Recorded in
// `buildStateForFE`, which every path that streams state goes through.
const ctrlsWithDeliveredState: Set<string> = new Set()

export function setCriticalControllers(controllers: string[]) {
  criticalControllerSet = new Set<string>(controllers)
}

function isCriticalController(ctrlName: string) {
  return criticalControllerSet.has(ctrlName)
}

function isControllerSubscribed(ctrlName: string) {
  return subscribedControllerSet.has(ctrlName)
}

/**
 * Whether a state for this controller has already been streamed to the UI. Guards the
 * subscription gate only: that gate has no deadline, so a controller nothing is
 * subscribed to yet would sit at the store's empty state indefinitely, and every screen
 * reads that state as if the controller's own shape were guaranteed. The boot-phase gate
 * needs no such guard because the UI releases it a frame after the routes render, and
 * the drain then delivers what it held.
 */
function hasDeliveredState(ctrlName: string) {
  return ctrlsWithDeliveredState.has(ctrlName)
}

/**
 * Used to prevent suppressing emitUpdates that deliver isReady
 */
function claimReadinessDelivery(ctrlName: string, ctrl: any) {
  if (ctrlsWithDeliveredReadiness.has(ctrlName)) return false
  if (ctrl?.isReady !== true) return false

  ctrlsWithDeliveredReadiness.add(ctrlName)
  return true
}

/**
 * Holds a controller's state back if not critical
 */
export function queueCtrlStateIfBootPhaseDeferred(
  ctrlName: string,
  ctrl: any,
  forceEmit?: boolean
) {
  // During the critical boot phase, hold back updates for non-critical
  // controllers. We keep only the latest state so the eventual drain emits
  // one update per deferred controller, not the full history.
  if (bootPhase === 'critical' && !isCriticalController(ctrlName)) {
    deferredCtrlPayloads.set(ctrlName, { ctrl, forceEmit })
    return true
  }

  return false
}

export function queueCtrlStateIfGated(ctrlName: string, ctrl: any, forceEmit?: boolean) {
  if (queueCtrlStateIfBootPhaseDeferred(ctrlName, ctrl, forceEmit)) return true

  if (claimReadinessDelivery(ctrlName, ctrl)) return false

  if (
    hasReceivedSubscriptionSet &&
    hasDeliveredState(ctrlName) &&
    !isCriticalController(ctrlName) &&
    !isControllerSubscribed(ctrlName)
  ) {
    suppressedCtrlPayloads.set(ctrlName, { ctrl, forceEmit })
    return true
  }

  return false
}

function buildStateForFE(ctrlName: string, ctrl: any) {
  const build = () => {
    const state = serializeControllerForUI(ctrl)

    // Recorded after the state is built, so a controller whose serialization throws is
    // not counted as delivered and the gates keep letting its first state through.
    ctrlsWithDeliveredState.add(ctrlName)

    return state
  }

  // Every path that streams state to the UI funnels through here, so timing the
  // first build per controller covers the debounced emits and the deferred drain
  // alike. Later emits are not boot cost and would grow the mark list forever.
  const markName = `${BOOT_MARK_PREFIX.rnCtrlSerialize}${ctrlName}`
  if (!bootProfiler.reserveOnce(markName)) return build()

  return bootProfiler.measure(markName, build)
}

// Drains queued controller payloads one per macrotask so a single synchronous
// burst can't block the JS thread. Uses a self-rescheduling chain (one pending
// timer at a time) rather than scheduling every entry up front, so the queue
// can't build a backlog of timers regardless of its size.
function drainCtrlPayloads(entries: [string, { ctrl: any; forceEmit?: boolean }][]) {
  let index = 0

  const drainNext = () => {
    const entry = entries[index]
    index += 1
    if (!entry) return
    const [ctrlName, { ctrl, forceEmit }] = entry

    // A drained payload carries the controller's readiness just like a live emit does,
    // so record it here too, or the gate would later let one redundant emit through.
    claimReadinessDelivery(ctrlName, ctrl)

    try {
      emitCtrlUpdate(ctrlName, buildStateForFE(ctrlName, ctrl), forceEmit)
    } catch (err) {
      ;(err as any).controllerName = ctrlName
      console.error('Debug: Failed to drain queued update for ctrl', ctrlName, err)
      emitCtrlError(ctrlName, [{ message: (err as any).message, stack: (err as any).stack }])
    }

    if (index < entries.length) setTimeout(drainNext, 0)
  }

  if (entries.length > 0) setTimeout(drainNext, 0)
}

// Called by the SET_BOOT_PHASE action once the UI has hidden the splash and is
// ready to absorb the heavy controller payloads. Drains the deferred queue
// across macrotasks so a single sync burst can't block the JS thread.
export function setBootPhase(phase: 'critical' | 'full') {
  if (phase === bootPhase) return
  bootPhase = phase

  if (phase === 'full') {
    bootProfiler.mark(BOOT_MARK.rnBootPhaseFull, { count: deferredCtrlPayloads.size })
  }

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
