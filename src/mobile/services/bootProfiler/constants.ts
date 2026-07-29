// Boot profiling constants. This module MUST stay dependency-free: it is imported
// by the very first line of the RN bundle (before the shims run) and by the first
// line of the WebView worker bundle, where `react-native` and `@env` are not
// resolvable.

// Master switch for the boot profiler, off unless `IS_BOOT_PROFILING_ENABLED=true`
// is in the environment of the build. Read through `process.env` rather than `@env`
// because this module is also compiled into the WebView worker bundle, whose webpack
// resolver has no `@env` alias. Both realms inline the read at build time: babel's
// transform-inline-environment-variables for the RN bundle, DefinePlugin for the
// worker bundle. It therefore has to be a shell variable and NOT a `.env` entry —
// `.env` reaches the worker's webpack config but never Metro. Both bundles are built
// separately, so both builds need the variable. See this folder's README.
//
// The numbers that matter come from a RELEASE build: dev boots download the RN
// bundle from Metro instead of mmap-ing Hermes bytecode, and fetch the worker
// bundle over HTTP from webpack-dev-server instead of reading it from `file://`.
// Those two differences dominate the timeline, so a dev profile tells you almost
// nothing about what users wait for.
export const IS_BOOT_PROFILING_ENABLED = process.env.IS_BOOT_PROFILING_ENABLED === 'true'

export const BOOT_PROFILE_REALM = {
  rn: 'rn',
  worker: 'worker',
  native: 'native'
} as const

// Bridge message the worker uses to ship its marks to the RN side, where the
// whole timeline is assembled and printed.
export const BOOT_PROFILE_MARKS_MESSAGE = 'perf.bootMarks'

// eventBus event the WebViewWorker re-emits the worker marks on.
export const BOOT_PROFILE_MARKS_EVENT = 'bootProfileMarks'

// How long to wait for the worker's marks after asking for them before printing
// the report without them.
export const BOOT_PROFILE_WORKER_FLUSH_TIMEOUT = 1500

// Fallback deadline. A boot that never reaches "all controllers ready" (a stuck
// controller, a dead dev server) is exactly the case worth profiling, so report
// anyway once this elapses.
export const BOOT_PROFILE_DEADLINE = 25000

export const BOOT_MARK = {
  // --- RN realm ---
  // First line of JS the RN bundle executes.
  rnJsEntry: 'rn.js.entry',
  // Entry module body done: shims, global.js, Sentry and localization all evaluated.
  rnEntryModuleEvaluated: 'rn.entryModule.evaluated',
  rnAppRender: 'rn.app.render',
  rnAppInitMounted: 'rn.appInit.mounted',
  // Synchronous full-MMKV dump handed to the worker so it can serve controller
  // boot reads from memory instead of ~79 bridge round-trips.
  rnStorageSnapshot: 'rn.storageSnapshot',
  // Prod only: writing the OTA-shipped worker bundle to the app sandbox.
  rnWorkerBundleMaterialized: 'rn.workerBundle.materialized',
  rnWebviewMounted: 'rn.webview.mounted',
  rnWebviewLoadStart: 'rn.webview.loadStart',
  rnWebviewLoadEnd: 'rn.webview.loadEnd',
  rnWorkerLoadedReceived: 'rn.worker.loadedReceived',
  rnInitPayloadEncoded: 'rn.initPayload.encoded',
  rnInitPayloadInjected: 'rn.initPayload.injected',
  rnWorkerReadyReceived: 'rn.worker.readyReceived',
  rnStoreCriticalReady: 'rn.store.criticalReady',
  rnStoreAllReady: 'rn.store.allReady',
  rnSplashHidden: 'rn.splash.hidden',
  rnFirstPaint: 'rn.firstPaint',

  // --- WebView worker realm ---
  // Stamped by an inline script in the worker HTML, right before the bundle
  // <script> tag. Splits "WebView spawn + HTML load" from "bundle fetch + SRI
  // hash + compile", which a `file://` load reports no resource timing for.
  // Prod only: the dev HTML keeps a CSP that admits no inline script.
  workerPageBundleTagReached: 'worker.page.bundleTagReached',
  // First line of the worker bundle: the WebView has fetched and parsed it.
  workerBundleEvalStart: 'worker.bundle.evalStart',
  // Whole module graph (ambire-common, ethers, ...) evaluated.
  workerImportsEvaluated: 'worker.imports.evaluated',
  workerInitReceived: 'worker.init.received',
  workerStorageCacheSeeded: 'worker.storageCache.seeded',
  workerMainCtrlConstructed: 'worker.mainCtrl.constructed',
  workerWalletStateCtrlConstructed: 'worker.walletStateCtrl.constructed',
  workerAutoLockCtrlConstructed: 'worker.autoLockCtrl.constructed',
  workerReady: 'worker.ready',
  workerBootPhaseFull: 'worker.bootPhase.full',

  // --- Native realm, from `performance.rnStartupTiming` ---
  nativeStartTime: 'native.startTime',
  nativeRuntimeInitStart: 'native.runtimeInit.start',
  nativeRuntimeInitEnd: 'native.runtimeInit.end',
  nativeBundleEvalStart: 'native.bundleEval.start',
  nativeBundleEvalEnd: 'native.bundleEval.end'
} as const

// Per-controller marks. Kept as prefixes because the controller name is appended;
// the report groups them back into the per-controller table.
export const BOOT_MARK_PREFIX = {
  // Worker side: `toJSON()` + nested-controller pruning for the first emit.
  workerCtrlSerialize: 'worker.ctrl.serialize.',
  // Worker side: richJson stringify + postMessage of the first emit.
  workerCtrlEncode: 'worker.ctrl.encode.',
  // RN side: richJson parse of the first state received.
  rnCtrlDecode: 'rn.ctrl.decode.',
  // RN side: wire size of one storage key inside the init snapshot.
  rnStorageKey: 'rn.storage.key.',
  // Worker side: the first read of one storage key. Its timestamp is what says
  // whether a key is needed to construct the controllers or only later.
  workerStorageRead: 'worker.storage.read.',
  // WebView page timings (navigation + the bundle's own resource entry).
  workerPage: 'worker.page.'
} as const
