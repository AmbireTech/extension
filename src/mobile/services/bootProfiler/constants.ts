// Boot profiling constants. This module MUST stay dependency-free: it is imported
// by the very first line of the RN bundle, before the shims run, where
// `react-native` and `@env` are not resolvable.

const bootProfilingFlag = process.env.IS_BOOT_PROFILING_ENABLED

/**
 * Whether the boot profiler records anything.
 **/
export const IS_BOOT_PROFILING_ENABLED = !bootProfilingFlag
  ? false
  : bootProfilingFlag.trim().toLowerCase() === 'true'

/** The two timelines a mark can belong to. Marks are merged across them by epoch. */
export const BOOT_PROFILE_REALM = {
  rn: 'rn',
  native: 'native'
} as const

/**
 * Fallback deadline in ms. A boot that never reaches "all non-deferred controllers ready" (a stuck
 * controller, a dead dev server) is exactly the case worth profiling, so report anyway
 * once this elapses.
 */
export const BOOT_PROFILE_DEADLINE = 25000

/**
 * Every point-in-time mark name, grouped by realm. The report keys its phase table off
 * these, so a rename here has to be mirrored in bootReport's `PHASES`.
 */
export const BOOT_MARK = {
  // --- RN realm ---
  // First line of JS the RN bundle executes.
  rnJsEntry: 'rn.js.entry',
  // shim.js done: quick-crypto installed, the ethers shims and the process/location/
  // document/window globals in place.
  rnShimsEvaluated: 'rn.shims.evaluated',
  // The entry's native-module bootstrap done: crash analytics, layout animation,
  // gesture handler, expo-asset and RN core.
  rnNativeModulesEvaluated: 'rn.nativeModules.evaluated',
  // Entry module body done, which past the bootstrap above means localization plus the
  // app's whole UI module graph has evaluated.
  rnEntryModuleEvaluated: 'rn.entryModule.evaluated',
  rnAppRender: 'rn.app.render',
  rnAppInitMounted: 'rn.appInit.mounted',
  // Constructing the controllers in the RN realm. These replace the worker's
  // equivalents and now sit on the JS thread, so the spans are the honest cost of
  // building the controller graph before the first screen can render.
  rnMainCtrlConstructed: 'rn.mainCtrl.constructed',
  rnWalletStateCtrlConstructed: 'rn.walletStateCtrl.constructed',
  rnAutoLockCtrlConstructed: 'rn.autoLockCtrl.constructed',
  rnControllersReady: 'rn.controllers.ready',
  rnBootPhaseFull: 'rn.bootPhase.full',
  rnStoreCriticalReady: 'rn.store.criticalReady',
  // Every controller except the deferred ones has landed in the store. The deferred
  // ones only start loading after unlock, which may never happen, so this is where the
  // measured boot ends and the report is printed.
  rnStoreNonDeferredReady: 'rn.store.nonDeferredReady',
  rnSplashHidden: 'rn.splash.hidden',
  rnFirstPaint: 'rn.firstPaint',

  // --- Native realm, from `performance.rnStartupTiming` ---
  nativeStartTime: 'native.startTime',
  nativeRuntimeInitStart: 'native.runtimeInit.start',
  nativeRuntimeInitEnd: 'native.runtimeInit.end',
  nativeBundleEvalStart: 'native.bundleEval.start',
  nativeBundleEvalEnd: 'native.bundleEval.end'
} as const

/**
 * Per-controller and per-key mark names. Kept as prefixes because the controller or
 * storage key is appended; the report groups them back into their own tables.
 */
export const BOOT_MARK_PREFIX = {
  // `toJSON()` + nested-controller pruning for the first emit of one controller.
  rnCtrlSerialize: 'rn.ctrl.serialize.'
} as const
