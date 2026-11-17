/**
 * Captures a Hermes JS CPU profile from a running app via the React Native
 * inspector, writes a Chrome-compatible trace and prints the hottest functions.
 *
 * React Native DevTools has no Performance panel, but the inspector still
 * implements the CDP `Tracing` domain and Hermes streams its sampling profiler
 * through it. This drives that directly, so no extra dependency or native
 * rebuild is needed.
 *
 *   yarn profile:js                 capture until you press Enter
 *   yarn profile:js --duration 10   capture for 10 seconds
 *   yarn profile:js --out trace.json
 *
 * Open the written file in Chrome DevTools (Performance tab, drag and drop) for
 * the flame chart. Numbers from a dev build are only meaningful relative to each
 * other; see src/mobile/services/bootProfiler/README.md for why.
 */
import { writeFileSync } from 'fs'

const METRO_TARGET_LIST_URL = 'http://localhost:8081/json/list'
// The inspector exposes one target per runtime. The React Native one runs the app's
// JS; the other ("UI") is the native view layer and has no JS samples to give.
const JS_TARGET_DESCRIPTION = 'Bridgeless'
const TRACING_COMPLETE_TIMEOUT_MS = 30000
const DEFAULT_TOP_N = 25
// V8 CPU profiler convention, which Hermes follows for the ProfileChunk payload.
const MICROSECONDS_PER_MS = 1000
const MS_PER_SECOND = 1000
// Synthetic Hermes frame for "the JS thread had nothing to do". Ranking it
// alongside real functions buries them, since an app at rest is ~100% idle.
const IDLE_FRAME = '(idle)'
const MOSTLY_IDLE_PERCENT = 95

const parseArgs = () => {
  const args = process.argv.slice(2)
  const valueOf = (flag) => {
    const index = args.indexOf(flag)
    return index === -1 ? undefined : args[index + 1]
  }

  return {
    duration: valueOf('--duration') ? Number(valueOf('--duration')) : undefined,
    out: valueOf('--out'),
    target: valueOf('--target') || JS_TARGET_DESCRIPTION,
    topN: valueOf('--top') ? Number(valueOf('--top')) : DEFAULT_TOP_N
  }
}

const resolveTarget = async (description) => {
  let targets
  try {
    targets = await (await fetch(METRO_TARGET_LIST_URL)).json()
  } catch {
    throw new Error(
      `Cannot reach the Metro inspector at ${METRO_TARGET_LIST_URL}. Is \`yarn start\` running?`
    )
  }

  if (!targets.length)
    throw new Error('Metro is running but no app is connected. Launch the app first.')

  const target = targets.find((t) => t.description?.includes(description))
  if (!target) {
    const available = targets.map((t) => `${t.title} - ${t.description}`).join('\n  ')
    throw new Error(`No target matching "${description}". Available:\n  ${available}`)
  }

  return target
}

/**
 * Metro serves the bundle under a URL carrying every transform option, which is
 * ~250 useless characters on each row. Only the line number identifies the frame.
 */
const formatLocation = (frame) => {
  if (!frame.url) return ''

  const line = frame.lineNumber ?? '?'
  const withoutQuery = frame.url.split('?')[0].split('//&')[0]
  const file = withoutQuery.split('/').filter(Boolean).pop() || withoutQuery

  return `${file}:${line}`
}

/**
 * Folds the raw trace events into self time per function. Hermes emits nodes
 * incrementally, so a node referenced by a sample may have been described in an
 * earlier chunk, which is why the node table is built across the whole trace.
 */
const summarize = (traceEvents) => {
  const callFrames = new Map()
  const selfTimeByNode = new Map()

  traceEvents.forEach((event) => {
    if (event.name !== 'ProfileChunk') return

    const { cpuProfile, timeDeltas = [] } = event.args?.data || {}
    if (!cpuProfile) return
    ;(cpuProfile.nodes || []).forEach((node) => callFrames.set(node.id, node.callFrame))
    ;(cpuProfile.samples || []).forEach((nodeId, index) => {
      selfTimeByNode.set(nodeId, (selfTimeByNode.get(nodeId) || 0) + (timeDeltas[index] || 0))
    })
  })

  const selfTimeByFunction = new Map()
  let idleMicroseconds = 0

  selfTimeByNode.forEach((microseconds, nodeId) => {
    const frame = callFrames.get(nodeId)
    if (!frame) return

    const name = frame.functionName || '(anonymous)'
    if (name === IDLE_FRAME) {
      idleMicroseconds += microseconds
      return
    }

    const where = formatLocation(frame)
    const key = `${name} at ${where}`
    const existing = selfTimeByFunction.get(key)

    if (existing) existing.microseconds += microseconds
    else selfTimeByFunction.set(key, { name, where, microseconds })
  })

  const rows = [...selfTimeByFunction.values()].sort((a, b) => b.microseconds - a.microseconds)
  const busyMicroseconds = rows.reduce((sum, row) => sum + row.microseconds, 0)

  return { rows, busyMicroseconds, idleMicroseconds }
}

const printSummary = ({ rows, busyMicroseconds, idleMicroseconds }, topN) => {
  const busyMs = busyMicroseconds / MICROSECONDS_PER_MS
  const totalMicroseconds = busyMicroseconds + idleMicroseconds
  const idleShare = totalMicroseconds ? (idleMicroseconds / totalMicroseconds) * 100 : 0

  console.log(
    `\n${busyMs.toFixed(0)}ms of JS thread work captured, ${idleShare.toFixed(0)}% of the window idle.`
  )

  if (idleShare > MOSTLY_IDLE_PERCENT) {
    console.log(
      'The thread was almost entirely idle, so this capture probably missed your slow path.'
    )
  }

  console.log('\nHottest functions by self time:\n')

  rows.slice(0, topN).forEach((row, index) => {
    const ms = row.microseconds / MICROSECONDS_PER_MS
    const share = busyMicroseconds ? (row.microseconds / busyMicroseconds) * 100 : 0
    const rank = String(index + 1).padStart(3)
    const time = `${ms.toFixed(1)}ms`.padStart(10)
    const percent = `${share.toFixed(1)}%`.padStart(7)
    console.log(`${rank}. ${time} ${percent}  ${row.name}${row.where ? `  ${row.where}` : ''}`)
  })
}

const capture = async ({ target, duration }) => {
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  const traceEvents = []
  let messageId = 0

  const send = (method, params = {}) => {
    messageId += 1
    socket.send(JSON.stringify({ id: messageId, method, params }))
  }

  return new Promise((resolve, reject) => {
    let completionTimer

    const stop = () => {
      send('Tracing.end')
      completionTimer = setTimeout(
        () => reject(new Error('Tracing.end sent but the app never reported tracingComplete.')),
        TRACING_COMPLETE_TIMEOUT_MS
      )
    }

    socket.onopen = () => {
      send('Tracing.start')
      console.log(`Recording ${target.title}.`)

      if (duration) {
        console.log(`Stopping automatically in ${duration}s. Exercise the slow path now.`)
        setTimeout(stop, duration * MS_PER_SECOND)
        return
      }

      console.log('Exercise the slow path now, then press Enter to stop.')
      process.stdin.once('data', stop)
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.method === 'Tracing.dataCollected')
        traceEvents.push(...(message.params.value || []))

      if (message.method === 'Tracing.tracingComplete') {
        clearTimeout(completionTimer)
        socket.close()
        resolve(traceEvents)
      }
    }

    socket.onerror = () => reject(new Error(`Lost the inspector connection to ${target.title}.`))
  })
}

const main = async () => {
  const { duration, out, target: targetDescription, topN } = parseArgs()
  const target = await resolveTarget(targetDescription)
  const traceEvents = await capture({ target, duration })

  const summary = summarize(traceEvents)
  if (!summary.rows.length && !summary.idleMicroseconds) {
    console.log('\nNo JS samples captured at all. Is the app in the foreground?')
    return
  }

  const outPath = out || `js-profile-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  writeFileSync(outPath, JSON.stringify({ traceEvents }))

  printSummary(summary, topN)
  console.log(`\nTrace written to ${outPath}`)
  console.log('Open it in Chrome DevTools (Performance tab) for the flame chart.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`\n${error.message}`)
    process.exit(1)
  })
