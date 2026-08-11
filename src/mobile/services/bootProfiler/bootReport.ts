// TODO: `expo-file-system/legacy` is the deprecated function-based API, kept here for
// consistency with the other mobile call sites (getWebviewBundleUri.ts,
// materializeWorkerBundle.ts). Migrate all of them together when Expo drops it.
import { documentDirectory, writeAsStringAsync } from 'expo-file-system/legacy'
import { Platform } from 'react-native'

import { APP_VERSION, isDev } from '@common/config/env'

import { getAllBootMarks } from './bootProfiler'
import { BOOT_MARK, BOOT_MARK_PREFIX } from './constants'
import { BootMark } from './types'

const PHASES: { label: string; from: string; to: string }[] = [
  {
    label: 'Native launch → first JS line',
    from: BOOT_MARK.nativeStartTime,
    to: BOOT_MARK.rnJsEntry
  },
  {
    label: '  ├ native runtime init',
    from: BOOT_MARK.nativeRuntimeInitStart,
    to: BOOT_MARK.nativeRuntimeInitEnd
  },
  {
    label: '  └ RN bundle load + eval (native-reported)',
    from: BOOT_MARK.nativeBundleEvalStart,
    to: BOOT_MARK.nativeBundleEvalEnd
  },
  {
    label: 'RN entry module eval (shims, global, Sentry, i18n)',
    from: BOOT_MARK.rnJsEntry,
    to: BOOT_MARK.rnEntryModuleEvaluated
  },
  {
    label: 'Entry evaluated → App rendered',
    from: BOOT_MARK.rnEntryModuleEvaluated,
    to: BOOT_MARK.rnAppRender
  },
  {
    label: 'App rendered → provider tree committed (all effects run)',
    from: BOOT_MARK.rnAppRender,
    to: BOOT_MARK.rnAppInitMounted
  },
  {
    label: '  └ App rendered → WebView worker mounted',
    from: BOOT_MARK.rnAppRender,
    to: BOOT_MARK.rnWebviewMounted
  },
  {
    label: 'WebView spawn + HTML load + worker bundle fetch/parse',
    from: BOOT_MARK.rnWebviewMounted,
    to: BOOT_MARK.workerBundleEvalStart
  },
  {
    label: '  ├ WebView spawn + HTML load (to the bundle <script> tag)',
    from: BOOT_MARK.rnWebviewMounted,
    to: BOOT_MARK.workerPageBundleTagReached
  },
  {
    label: '  └ bundle fetch + SRI hash + compile',
    from: BOOT_MARK.workerPageBundleTagReached,
    to: BOOT_MARK.workerBundleEvalStart
  },
  {
    label: 'Worker module graph eval (ambire-common, ethers, ...)',
    from: BOOT_MARK.workerBundleEvalStart,
    to: BOOT_MARK.workerImportsEvaluated
  },
  {
    label: 'Worker loaded → init payload injected',
    from: BOOT_MARK.rnWorkerLoadedReceived,
    to: BOOT_MARK.rnInitPayloadInjected
  },
  {
    label: 'Init payload injected → received in worker',
    from: BOOT_MARK.rnInitPayloadInjected,
    to: BOOT_MARK.workerInitReceived
  },
  {
    label: 'Controller construction (new MainController, ...)',
    from: BOOT_MARK.workerInitReceived,
    to: BOOT_MARK.workerReady
  },
  {
    label: 'Worker ready → critical controller states in store',
    from: BOOT_MARK.rnWorkerReadyReceived,
    to: BOOT_MARK.rnStoreCriticalReady
  },
  {
    label: 'Critical ready → splash hidden',
    from: BOOT_MARK.rnStoreCriticalReady,
    to: BOOT_MARK.rnSplashHidden
  },
  {
    label: 'Splash hidden → first paint',
    from: BOOT_MARK.rnSplashHidden,
    to: BOOT_MARK.rnFirstPaint
  },
  {
    label: 'Critical ready → ALL controller states in store',
    from: BOOT_MARK.rnStoreCriticalReady,
    to: BOOT_MARK.rnStoreAllReady
  }
]

const formatMs = (ms: number) => `${ms >= 100 ? Math.round(ms) : Math.round(ms * 10) / 10}`

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`
  return `${Math.round(bytes / (1024 * 102.4)) / 10} MB`
}

const formatDetail = (mark: BootMark) => {
  const { detail } = mark
  if (!detail) return ''

  const parts: string[] = []
  if (detail.durationMs !== undefined) parts.push(`took ${formatMs(detail.durationMs)}ms`)
  if (detail.bytes !== undefined) parts.push(formatBytes(detail.bytes))
  if (detail.count !== undefined) parts.push(`n=${detail.count}`)
  if (detail.note) parts.push(detail.note)

  return parts.join('  ')
}

const findMark = (marks: BootMark[], name: string) => marks.find((mark) => mark.name === name)

// Marks that have their own table and would otherwise bury the timeline under one
// row per storage key.
const TIMELINE_EXCLUDED_PREFIXES = [
  BOOT_MARK_PREFIX.rnStorageKey,
  BOOT_MARK_PREFIX.workerStorageRead
]

const buildTimeline = (allMarks: BootMark[], originMs: number) => {
  const marks = allMarks.filter(
    (mark) => !TIMELINE_EXCLUDED_PREFIXES.some((prefix) => mark.name.startsWith(prefix))
  )

  const rows = marks.map((mark, index) => {
    const previous = index > 0 ? marks[index - 1] : undefined
    const deltaMs = previous ? mark.epochMs - previous.epochMs : 0

    return [
      `${formatMs(mark.epochMs - originMs).padStart(7)}`,
      `${(deltaMs ? `+${formatMs(deltaMs)}` : '').padStart(7)}`,
      mark.realm.padEnd(6),
      mark.name.padEnd(42),
      formatDetail(mark)
    ].join(' ')
  })

  return [
    `${'t+ms'.padStart(7)} ${'Δ'.padStart(7)} ${'realm'.padEnd(6)} ${'mark'.padEnd(42)} detail`,
    ...rows
  ].join('\n')
}

const buildPhaseSummary = (marks: BootMark[]) => {
  const rows = PHASES.map(({ label, from, to }) => {
    const start = findMark(marks, from)
    const end = findMark(marks, to)
    if (!start || !end) return null

    return `${`${formatMs(end.epochMs - start.epochMs)}ms`.padStart(9)}  ${label}`
  }).filter(Boolean) as string[]

  const first = marks[0]
  const paint = findMark(marks, BOOT_MARK.rnFirstPaint)
  if (first && paint) {
    rows.push(
      `${`${formatMs(paint.epochMs - first.epochMs)}ms`.padStart(9)}  TOTAL (${first.name} → first paint)`
    )
  }

  return rows.join('\n')
}

/** The individual measured spans, biggest first. This is the hit list. */
const buildSpanRanking = (marks: BootMark[]) => {
  const spans = marks
    .filter((mark) => mark.detail?.durationMs !== undefined)
    .sort((a, b) => (b.detail?.durationMs ?? 0) - (a.detail?.durationMs ?? 0))

  if (!spans.length) return 'no spans recorded'

  return spans
    .map(
      (mark) =>
        `${`${formatMs(mark.detail!.durationMs!)}ms`.padStart(9)}  ${mark.realm.padEnd(6)} ${
          mark.name
        }${mark.detail?.bytes !== undefined ? `  (${formatBytes(mark.detail.bytes)})` : ''}`
    )
    .join('\n')
}

type ControllerRow = {
  name: string
  serializeMs?: number
  encodeMs?: number
  bytes?: number
  decodeMs?: number
  arrivedAtMs?: number
}

/**
 * Per-controller cost of getting the first state across the bridge: `toJSON` in
 * the worker, richJson stringify, wire size, richJson parse on the RN side.
 */
const buildControllerTable = (marks: BootMark[], originMs: number) => {
  const rows: Map<string, ControllerRow> = new Map()

  const rowFor = (name: string) => {
    if (!rows.has(name)) rows.set(name, { name })
    return rows.get(name)!
  }

  marks.forEach((mark) => {
    if (mark.name.startsWith(BOOT_MARK_PREFIX.workerCtrlSerialize)) {
      rowFor(mark.name.slice(BOOT_MARK_PREFIX.workerCtrlSerialize.length)).serializeMs =
        mark.detail?.durationMs
    } else if (mark.name.startsWith(BOOT_MARK_PREFIX.workerCtrlEncode)) {
      const row = rowFor(mark.name.slice(BOOT_MARK_PREFIX.workerCtrlEncode.length))
      row.encodeMs = mark.detail?.durationMs
      row.bytes = mark.detail?.bytes
    } else if (mark.name.startsWith(BOOT_MARK_PREFIX.rnCtrlDecode)) {
      const row = rowFor(mark.name.slice(BOOT_MARK_PREFIX.rnCtrlDecode.length))
      row.decodeMs = mark.detail?.durationMs
      row.arrivedAtMs = mark.epochMs - originMs
      if (row.bytes === undefined) row.bytes = mark.detail?.bytes
    }
  })

  if (!rows.size) return 'no controller states recorded'

  const totalCost = (row: ControllerRow) =>
    (row.serializeMs ?? 0) + (row.encodeMs ?? 0) + (row.decodeMs ?? 0)

  const header = `${'controller'.padEnd(34)} ${'toJSON'.padStart(8)} ${'encode'.padStart(
    8
  )} ${'decode'.padStart(8)} ${'total'.padStart(8)} ${'wire'.padStart(10)} ${'arrived'.padStart(9)}`

  const body = Array.from(rows.values())
    .sort((a, b) => totalCost(b) - totalCost(a))
    .map((row) =>
      [
        row.name.padEnd(34),
        `${row.serializeMs !== undefined ? formatMs(row.serializeMs) : '-'}`.padStart(8),
        `${row.encodeMs !== undefined ? formatMs(row.encodeMs) : '-'}`.padStart(8),
        `${row.decodeMs !== undefined ? formatMs(row.decodeMs) : '-'}`.padStart(8),
        `${formatMs(totalCost(row))}`.padStart(8),
        `${row.bytes !== undefined ? formatBytes(row.bytes) : '-'}`.padStart(10),
        `${row.arrivedAtMs !== undefined ? `t+${formatMs(row.arrivedAtMs)}` : '-'}`.padStart(9)
      ].join(' ')
    )

  const totalBytes = Array.from(rows.values()).reduce((sum, row) => sum + (row.bytes ?? 0), 0)
  const totalMs = Array.from(rows.values()).reduce((sum, row) => sum + totalCost(row), 0)

  return [
    header,
    ...body,
    '',
    `${rows.size} controllers, ${formatBytes(totalBytes)} across the bridge, ${formatMs(
      totalMs
    )}ms of serialize+encode+decode`
  ].join('\n')
}

type StorageKeyRow = {
  key: string
  bytes?: number
  firstReadAtMs?: number
  firstReadAtEpochMs?: number
}

/**
 * Per-key breakdown of the init storage snapshot: how much of the payload each key
 * is, and when the worker first read it.
 *
 * The `when` column says when the read happened, not whether the feature behind it
 * matters that early — a key read while the splash is up is only genuinely needed
 * there if a critical controller is waiting on it. Keys read after the splash, or
 * not read at all, are paid for during the splash for nothing.
 */
const buildStorageTable = (marks: BootMark[], originMs: number) => {
  const rows: Map<string, StorageKeyRow> = new Map()

  const rowFor = (key: string) => {
    if (!rows.has(key)) rows.set(key, { key })
    return rows.get(key)!
  }

  marks.forEach((mark) => {
    if (mark.name.startsWith(BOOT_MARK_PREFIX.rnStorageKey)) {
      rowFor(mark.name.slice(BOOT_MARK_PREFIX.rnStorageKey.length)).bytes = mark.detail?.bytes
    } else if (mark.name.startsWith(BOOT_MARK_PREFIX.workerStorageRead)) {
      const row = rowFor(mark.name.slice(BOOT_MARK_PREFIX.workerStorageRead.length))
      row.firstReadAtMs = mark.epochMs - originMs
      row.firstReadAtEpochMs = mark.epochMs
    }
  })

  if (!rows.size) return 'no storage keys recorded'

  const all = Array.from(rows.values())
  const totalBytes = all.reduce((sum, row) => sum + (row.bytes ?? 0), 0)

  const share = (bytes?: number) =>
    bytes === undefined || !totalBytes ? '-' : `${Math.round((bytes / totalBytes) * 1000) / 10}%`

  const readyMs = findMark(marks, BOOT_MARK.workerReady)?.epochMs
  const splashMs = findMark(marks, BOOT_MARK.rnSplashHidden)?.epochMs

  const isReadAfterSplash = (row: StorageKeyRow) =>
    row.firstReadAtEpochMs === undefined ||
    (splashMs !== undefined && row.firstReadAtEpochMs > splashMs)

  const when = (row: StorageKeyRow) => {
    if (row.firstReadAtEpochMs === undefined) return 'never read at boot'
    if (readyMs !== undefined && row.firstReadAtEpochMs <= readyMs) return 'blocks construction'
    return isReadAfterSplash(row) ? 'after splash' : 'during splash'
  }

  const header = `${'storage key'.padEnd(40)} ${'wire'.padStart(10)} ${'share'.padStart(
    7
  )} ${'1st read'.padStart(9)}  when`

  const body = all
    .sort((a, b) => (b.bytes ?? 0) - (a.bytes ?? 0))
    .map((row) =>
      [
        row.key.padEnd(40),
        `${row.bytes !== undefined ? formatBytes(row.bytes) : '-'}`.padStart(10),
        share(row.bytes).padStart(7),
        `${row.firstReadAtMs !== undefined ? `t+${formatMs(row.firstReadAtMs)}` : '-'}`.padStart(9),
        ` ${when(row)}`
      ].join(' ')
    )

  const afterSplashBytes = all
    .filter(isReadAfterSplash)
    .reduce((sum, row) => sum + (row.bytes ?? 0), 0)

  return [
    header,
    ...body,
    '',
    `${rows.size} keys, ${formatBytes(totalBytes)} total, ${formatBytes(
      afterSplashBytes
    )} (${share(afterSplashBytes)}) not read until after the splash`
  ].join('\n')
}

const buildMissingNativeNote = (marks: BootMark[]) => {
  if (findMark(marks, BOOT_MARK.nativeStartTime)) return ''

  return [
    '',
    'NOTE: performance.rnStartupTiming was empty, so everything before the first JS',
    'line is missing from this report. Measure it with platform tooling:',
    '  Android  adb shell am force-stop com.ambire.wallet',
    '           adb shell am start -W -n com.ambire.wallet/.MainActivity',
    '           (ThisTime/TotalTime, then correlate the logcat wall clock with t+0 above)',
    '  iOS      Xcode → Product → Profile → App Launch (pre-main dyld vs post-main)'
  ].join('\n')
}

export const buildBootReport = (): string => {
  const marks = getAllBootMarks()
  const [firstMark] = marks
  if (!firstMark) return 'Boot profile: no marks recorded'

  const originMs = firstMark.epochMs
  const build = isDev ? 'DEV (Metro bundle + HTTP worker bundle — not representative)' : 'RELEASE'

  return [
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `Ambire boot profile — ${Platform.OS} — v${APP_VERSION} — ${build}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    '── Phase summary ──',
    buildPhaseSummary(marks),
    '',
    '── Measured spans, slowest first ──',
    buildSpanRanking(marks),
    '',
    '── First controller state across the bridge, most expensive first ──',
    buildControllerTable(marks, originMs),
    '',
    '── Init storage snapshot by key, biggest first ──',
    buildStorageTable(marks, originMs),
    '',
    '── Full timeline ──',
    buildTimeline(marks, originMs),
    buildMissingNativeNote(marks),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ''
  ].join('\n')
}

/**
 * Writes the raw marks next to the printed report so separate runs can be diffed
 * and medians taken. Resolves with the file path, or null when the write fails
 * (a missing document directory, a full disk) — profiling must never break boot.
 */
export const writeBootProfileJson = async (): Promise<string | null> => {
  if (!documentDirectory) return null

  const marks = getAllBootMarks()
  const path = `${documentDirectory}boot-profile-${marks[0]?.epochMs ?? Date.now()}.json`

  try {
    await writeAsStringAsync(
      path,
      JSON.stringify({ platform: Platform.OS, appVersion: APP_VERSION, isDev, marks })
    )
    return path
  } catch (error) {
    console.warn('[bootProfiler] could not write the boot profile JSON', error)
    return null
  }
}
