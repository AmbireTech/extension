/**
 * SES Lockdown Initialization
 *
 * Must run before any application code or library imports that could
 * mutate shared intrinsics.
 *
 * Import order matters:
 * 1. ses (provides lockdown and harden globals)
 * 2. call lockdown() to freeze intrinsics
 * 3. Everything else runs in hardened environment
 */
import 'ses'

try {
  lockdown({
    // 'unsafe' preserves Error.stack for Sentry and debugging
    errorTaming: 'unsafe',
    // 'verbose' keeps full stack traces (no filtering of SES frames)
    stackFiltering: 'verbose',
    // 'severe' allows Object.defineProperty overrides on frozen prototypes,
    // needed by ProvidePlugin globals (Buffer, process) and many libraries
    overrideTaming: 'severe',
    // 'unsafe' preserves locale-dependent methods (toLocaleString, etc.)
    localeTaming: 'unsafe',
    // 'unsafe' preserves original console behavior for debugging
    consoleTaming: 'unsafe'
  })
  console.log('lockdown!')
} catch (err) {
  // If lockdown fails (e.g. already called by LavaMoat inline), log but
  // do not crash the service worker. This is a safety net, not expected
  // in normal operation.
  // eslint-disable-next-line no-console
  console.warn('[SES] lockdown() failed or was already called:', err)
}

// reflect-metadata compatibility shim:
// After lockdown, the Reflect object is frozen and non-standard properties
// are stripped. Ledger SDK packages (@ledgerhq/context-module,
// @ledgerhq/device-management-kit and @ledgerhq/device-signer-kit-ethereum)
// depend on reflect-metadata, which adds methods like
// Reflect.getOwnMetadata via Object.defineProperty — this
// throws on a frozen target.
//
// Fix: replace globalThis.Reflect with an unfrozen copy that carries the
// same standard methods. When reflect-metadata is later evaluated (pulled
// in by Ledger deps), it patches the mutable copy successfully.
//
// globalThis itself is NOT frozen by SES, only its intrinsic *values* are.
// ---------------------------------------------------------------------------
try {
  const frozenReflect = Reflect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutableReflect: any = {}

  for (const key of Reflect.ownKeys(frozenReflect)) {
    try {
      mutableReflect[key] = (frozenReflect as any)[key]
    } catch {
      // skip non-readable properties (unlikely, but defensive)
    }
  }

  ;(globalThis as any).Reflect = mutableReflect
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[SES] Failed to create mutable Reflect wrapper:', err)
}
