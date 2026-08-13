// TODO: `expo-file-system/legacy` is the deprecated function-based API, kept here for
// consistency with the other mobile call sites. Migrate all of them together when
// Expo drops it.
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
    label: 'RN entry module eval (shims, native modules, UI module graph)',
    from: BOOT_MARK.rnJsEntry,
    to: BOOT_MARK.rnEntryModuleEvaluated
  },
  {
    label: '  ├ shims (quick-crypto, ethers, globals)',
    from: BOOT_MARK.rnJsEntry,
    to: BOOT_MARK.rnShimsEvaluated
  },
  {
    label: '  ├ native modules (gesture handler, expo-asset, RN core)',
    from: BOOT_MARK.rnShimsEvaluated,
    to: BOOT_MARK.rnNativeModulesEvaluated
  },
  {
    label: '  └ App module graph (i18n, providers, screens)',
    from: BOOT_MARK.rnNativeModulesEvaluated,
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
    label: 'Controller construction (new MainController, ...)',
    from: BOOT_MARK.rnAppInitMounted,
    to: BOOT_MARK.rnControllersReady
  },
  {
    label: '  ├ MainController',
    from: BOOT_MARK.rnMainCtrlConstructed,
    to: BOOT_MARK.rnMainCtrlConstructed
  },
  {
    label: '  ├ WalletStateController',
    from: BOOT_MARK.rnWalletStateCtrlConstructed,
    to: BOOT_MARK.rnWalletStateCtrlConstructed
  },
  {
    label: '  └ AutoLockController',
    from: BOOT_MARK.rnAutoLockCtrlConstructed,
    to: BOOT_MARK.rnAutoLockCtrlConstructed
  },
  {
    label: 'Controllers ready → critical controller states in store',
    from: BOOT_MARK.rnControllersReady,
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
    label: 'Critical ready → all non-deferred controller states in store',
    from: BOOT_MARK.rnStoreCriticalReady,
    to: BOOT_MARK.rnStoreNonDeferredReady
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
const TIMELINE_EXCLUDED_PREFIXES = [BOOT_MARK_PREFIX.rnCtrlSerialize]

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

  const paint = findMark(marks, BOOT_MARK.rnFirstPaint)
  // Anchored on the first line of JS rather than on marks[0], so the headline number
  // stays comparable across runs whether or not the native marks came through. The
  // native launch window gets its own total below.
  const jsEntry = findMark(marks, BOOT_MARK.rnJsEntry)
  if (jsEntry && paint) {
    rows.push(
      `${`${formatMs(paint.epochMs - jsEntry.epochMs)}ms`.padStart(9)}  TOTAL (${
        jsEntry.name
      } → first paint)`
    )
  }

  const nativeStart = findMark(marks, BOOT_MARK.nativeStartTime)
  if (nativeStart && paint) {
    rows.push(
      `${`${formatMs(paint.epochMs - nativeStart.epochMs)}ms`.padStart(
        9
      )}  TOTAL incl. native launch (${nativeStart.name} → first paint)`
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
  arrivedAtMs?: number
}

/**
 * What the first state of each controller costs to hand to the UI. Only `toJSON()`
 * plus the nested-controller pruning is left now that the controllers run in the
 * same realm as the UI — there is no serialization across a bridge to pay for.
 */
const buildControllerTable = (marks: BootMark[], originMs: number) => {
  const rows: Map<string, ControllerRow> = new Map()

  marks.forEach((mark) => {
    if (!mark.name.startsWith(BOOT_MARK_PREFIX.rnCtrlSerialize)) return

    const name = mark.name.slice(BOOT_MARK_PREFIX.rnCtrlSerialize.length)
    rows.set(name, {
      name,
      serializeMs: mark.detail?.durationMs,
      arrivedAtMs: mark.epochMs - originMs
    })
  })

  if (!rows.size) return 'no controller states recorded'

  const header = `${'controller'.padEnd(34)} ${'toJSON'.padStart(8)} ${'arrived'.padStart(9)}`

  const body = Array.from(rows.values())
    .sort((a, b) => (b.serializeMs ?? 0) - (a.serializeMs ?? 0))
    .map((row) =>
      [
        row.name.padEnd(34),
        `${row.serializeMs !== undefined ? formatMs(row.serializeMs) : '-'}`.padStart(8),
        `${row.arrivedAtMs !== undefined ? `t+${formatMs(row.arrivedAtMs)}` : '-'}`.padStart(9)
      ].join(' ')
    )

  const totalMs = Array.from(rows.values()).reduce((sum, row) => sum + (row.serializeMs ?? 0), 0)

  return [
    header,
    ...body,
    '',
    `${rows.size} controllers, ${formatMs(totalMs)}ms of serialization`
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
  const build = isDev ? 'DEV (Metro bundle — not representative)' : 'RELEASE'

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
    '── First controller state serialization, most expensive first ──',
    buildControllerTable(marks, originMs),
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
