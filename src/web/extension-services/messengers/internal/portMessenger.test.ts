const mockGetManifest = jest.fn(
  (): Record<string, string> => ({ message_serialization: 'structured_clone' })
)

jest.mock('@web/constants/browserapi', () => ({
  browser: { runtime: { getManifest: mockGetManifest } }
}))

const mockCaptureException = jest.fn()

jest.mock('@common/config/analytics/CrashAnalytics', () => ({
  captureException: mockCaptureException
}))

jest.mock('@common/utils/logger', () => ({
  logInfoWithPrefix: jest.fn(),
  logWarnWithPrefix: jest.fn()
}))

import { stringify } from '@ambire-common/libs/richJson/richJson'
import { reconcileState } from '@common/utils/reconcileState'

import { STRUCTURED_CLONE_PROBE_KEY } from './messageSerialization'

import type { Port, PortMessenger as PortMessengerType } from './portMessenger'

const TEST_METHOD = 'MainController'
const STRUCTURED_CLONE_MANIFEST = { message_serialization: 'structured_clone' }
const JSON_MANIFEST = {}

type FakePort = Port & {
  messages: any[]
  onMessageListener?: (data: any) => void
}

let PortMessenger: typeof PortMessengerType

// The probe result is cached per module, so a fresh module forgets it.
const loadFreshPortMessenger = () => {
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ;({ PortMessenger } = require('./portMessenger'))
  })
}

beforeEach(() => {
  mockGetManifest.mockReturnValue(STRUCTURED_CLONE_MANIFEST)
  mockCaptureException.mockClear()
  mockGetManifest.mockClear()
  loadFreshPortMessenger()
})

function createPort(id: string, postMessage: (message: any) => void): FakePort {
  const port = {
    id,
    name: 'popup',
    messages: [],
    postMessage(message: any) {
      postMessage(message)
      port.messages.push(message)
    },
    disconnect: jest.fn(),
    onMessage: {
      addListener: (listener: (data: any) => void) => {
        port.onMessageListener = listener
      },
      removeListener: jest.fn()
    },
    onDisconnect: { addListener: jest.fn(), removeListener: jest.fn() }
  } as unknown as FakePort

  return port
}

/**
 * Sends one message from a background messenger to a UI messenger over a port that
 * copies it the way Chrome does: the structured clone algorithm on the structured clone
 * path, and on the JSON path too, where the envelope only ever holds strings. Hands back
 * what the UI listener received and the envelope that crossed the port.
 */
function deliverThroughPort(message: any, meta?: any) {
  const uiPort = createPort('ui', () => undefined)
  const backgroundPort = createPort('background', (envelope) => {
    uiPort.onMessageListener?.(structuredClone(envelope))
  })
  const uiMessenger = new PortMessenger([uiPort])
  const callback = jest.fn()
  uiMessenger.addConnectListener('ui', callback)

  new PortMessenger([backgroundPort]).send('> ui', message, meta)

  expect(callback).toHaveBeenCalledTimes(1)
  const [, receivedMessage, receivedMeta] = callback.mock.calls[0]

  return { receivedMessage, receivedMeta, envelope: backgroundPort.messages.at(-1) }
}

/**
 * The value with every error turned into a plain object of its own props, which is
 * what the structured clone path delivers in place of an error.
 */
function flattenErrors(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(flattenErrors)

  const keys = value instanceof Error ? Object.getOwnPropertyNames(value) : Object.keys(value)

  return Object.fromEntries(keys.map((key) => [key, flattenErrors((value as any)[key])]))
}

/** A controller state holding errors in the fields that really carry them to the UI. */
function createStateWithErrors() {
  const rpcError: Error & { code?: string; context?: object } = new Error('RPC failed')
  rpcError.code = 'E_RPC'
  rpcError.context = { chainId: 1n, retryable: false }
  const causeError = new Error('socket closed')
  const wrappingError: Error & { cause?: unknown } = new Error('Could not refresh')
  wrappingError.cause = causeError

  return {
    portfolio: { total: 12345n, tokens: [{ symbol: 'ETH', amount: 10n ** 18n }] },
    estimationError: rpcError,
    emailVaultStates: { errors: [rpcError, wrappingError] }
  }
}

describe('PortMessenger structured clone transport', () => {
  test('uses richJson without sending a probe when the manifest has no opt-in', () => {
    mockGetManifest.mockReturnValue(JSON_MANIFEST)
    const port = createPort('legacy', () => undefined)
    const messenger = new PortMessenger([port])

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })

    expect(port.messages).toHaveLength(1)
    expect(typeof port.messages[0].message).toBe('string')
    expect(port.messages[0][STRUCTURED_CLONE_PROBE_KEY]).toBeUndefined()
  })

  test('reads the manifest only on the first send when it has no opt-in', () => {
    mockGetManifest.mockReturnValue(JSON_MANIFEST)
    const port = createPort('legacy', () => undefined)
    const messenger = new PortMessenger([port])

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1 } })
    messenger.sendToPort(port, '> ui', { method: TEST_METHOD, params: { amount: 2 } })
    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 3 } })

    console.log('manifest reads', mockGetManifest.mock.calls.length, 'messages', port.messages)
    expect(mockGetManifest).toHaveBeenCalledTimes(1)
    expect(port.messages.map((message) => typeof message.message)).toEqual([
      'string',
      'string',
      'string'
    ])
  })

  test('reads the manifest only on the first send when it opts in', () => {
    const port = createPort('structured', () => undefined)
    const messenger = new PortMessenger([port])

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })
    messenger.sendToPort(port, '> ui', { method: TEST_METHOD, params: { amount: 2n } })
    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 3n } })

    const sent = port.messages.filter((message) => message.messageType)
    console.log('manifest reads', mockGetManifest.mock.calls.length, 'messages', port.messages)
    expect(mockGetManifest).toHaveBeenCalledTimes(1)
    expect(sent.map((message) => message.message.params.amount)).toEqual([1n, 2n, 3n])
  })

  test('normalizes once and posts the prepared raw envelope to every port', () => {
    const first = createPort('first', () => undefined)
    const second = createPort('second', () => undefined)
    const messenger = new PortMessenger([first, second])
    const params = {
      nested: { secret: 'secret', toJSON: () => ({ safe: true }) },
      amount: 1n,
      notANumber: Number.NaN
    }

    messenger.send('> ui', { method: TEST_METHOD, params })

    expect(first.messages).toHaveLength(2)
    expect(second.messages).toHaveLength(1)
    expect(first.messages[0][STRUCTURED_CLONE_PROBE_KEY]).toBe(1n)
    expect(first.messages[1]).toMatchObject({
      messageType: '> ui',
      message: {
        method: TEST_METHOD,
        params: { nested: { safe: true }, amount: 1n, notANumber: null }
      },
      meta: {}
    })
    expect(second.messages[0]).toEqual(first.messages[1])
    expect(first.messages[1].message).toBe(second.messages[0].message)
  })

  test('delivers every error in the state as a plain object that keeps all of its props', () => {
    const state = createStateWithErrors()
    const { envelope, receivedMessage } = deliverThroughPort({ method: TEST_METHOD, params: state })

    const { estimationError, emailVaultStates } = receivedMessage.params
    console.log('errors as the UI receives them', { estimationError, emailVaultStates })
    expect(typeof envelope.message).toBe('object')
    // Checked by tag, as Jest's `structuredClone` builds objects in another realm.
    expect(Object.prototype.toString.call(estimationError)).toBe('[object Object]')
    expect(estimationError).not.toBeInstanceOf(Error)
    expect(estimationError).toEqual({
      message: 'RPC failed',
      stack: state.estimationError.stack,
      code: 'E_RPC',
      context: { chainId: 1n, retryable: false }
    })
    expect(emailVaultStates.errors[1].cause.message).toBe('socket closed')
  })

  test('hands the UI store the same state on both transports, errors aside from their prototype', () => {
    // One state for both, so even the stacks the errors captured are the same.
    const state = createStateWithErrors()
    const send = () => deliverThroughPort({ method: TEST_METHOD, params: state })

    mockGetManifest.mockReturnValue(JSON_MANIFEST)
    const overJson = send()
    loadFreshPortMessenger()
    mockGetManifest.mockReturnValue(STRUCTURED_CLONE_MANIFEST)
    const overStructuredClone = send()

    expect(typeof overJson.envelope.message).toBe('string')
    expect(typeof overStructuredClone.envelope.message).toBe('object')

    // What `controllerStore.update` keeps of each.
    const storedFromJson = reconcileState(undefined, overJson.receivedMessage.params)
    const storedFromStructuredClone = reconcileState(
      undefined,
      overStructuredClone.receivedMessage.params
    )
    console.dir(storedFromStructuredClone, { depth: null })

    expect(storedFromStructuredClone).toEqual(flattenErrors(storedFromJson))
  })

  test('delivers an error travelling in meta with its message', () => {
    const { receivedMeta } = deliverThroughPort(
      { method: TEST_METHOD, params: {} },
      { windowId: 1, failure: new Error('window closed') }
    )

    expect(receivedMeta.windowId).toBe(1)
    expect(receivedMeta.failure.message).toBe('window closed')
  })

  test('falls back to richJson for a port that rejects a structured envelope and reports why', () => {
    const structuredCloneError = new Error('structured clone failed')
    const port = createPort('fallback', (message) => {
      if (message[STRUCTURED_CLONE_PROBE_KEY]) return
      if (typeof message.message !== 'string') throw structuredCloneError
    })
    const messenger = new PortMessenger([port])
    const onSendError = jest.fn()
    messenger.onSendError = onSendError

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })

    console.log('reported to crash analytics', mockCaptureException.mock.calls)
    expect(port.messages).toHaveLength(2)
    expect(port.messages[0][STRUCTURED_CLONE_PROBE_KEY]).toBe(1n)
    expect(typeof port.messages[1].message).toBe('string')
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledWith(structuredCloneError)
    expect(onSendError).not.toHaveBeenCalled()
  })

  test('falls back to richJson and reports it when the message cannot be prepared', () => {
    const preparationError = new Error('toJSON failed')
    const port = createPort('unpreparable', () => undefined)
    const messenger = new PortMessenger([port])
    // Throws only on the first call, which is the structured clone preparation, so the
    // richJson fallback can still serialize it.
    let toJSONCalls = 0
    const params = {
      toJSON: () => {
        toJSONCalls += 1
        if (toJSONCalls === 1) throw preparationError

        return { safe: true }
      }
    }

    messenger.send('> ui', { method: TEST_METHOD, params })

    const sent = port.messages.filter((message) => message.messageType)
    console.log('messages sent after a failed preparation', sent)
    expect(sent).toHaveLength(1)
    expect(sent[0].message).toBe(stringify({ method: TEST_METHOD, params: { safe: true } }))
    expect(mockCaptureException).toHaveBeenCalledTimes(1)
    expect(mockCaptureException).toHaveBeenCalledWith(preparationError)
  })

  test('does not let a dead port prevent a live port from receiving a message', () => {
    const deadPort = createPort('dead', () => {
      throw new Error('disconnected')
    })
    const livePort = createPort('live', () => undefined)
    const messenger = new PortMessenger([deadPort, livePort])
    const onSendError = jest.fn()
    messenger.onSendError = onSendError

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })

    expect(onSendError).toHaveBeenCalledTimes(1)
    expect(livePort.messages).toHaveLength(1)
    expect(typeof livePort.messages[0].message).toBe('string')
    // A dead port is expected, so nothing is reported.
    expect(mockCaptureException).not.toHaveBeenCalled()
  })

  test('probes again after a dead port, instead of settling on richJson for good', () => {
    const deadPort = createPort('dead', () => {
      throw new Error('Attempting to use a disconnected port object')
    })
    const messenger = new PortMessenger([deadPort])
    messenger.onSendError = jest.fn()

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })

    const livePort = createPort('live', () => undefined)
    messenger.ports = [livePort]
    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1n } })

    console.log('messages on the live port', livePort.messages)
    expect(livePort.messages[0][STRUCTURED_CLONE_PROBE_KEY]).toBe(1n)
    expect(livePort.messages[1].message).toEqual({ method: TEST_METHOD, params: { amount: 1n } })
  })

  test('settles on richJson for good once the browser rejects the BigInt probe', () => {
    const jsonOnlyPort = createPort('json-only', (message) => {
      JSON.stringify(message)
    })
    const messenger = new PortMessenger([jsonOnlyPort])

    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 1 } })
    messenger.send('> ui', { method: TEST_METHOD, params: { amount: 2 } })

    const probes = jsonOnlyPort.messages.filter((message) => STRUCTURED_CLONE_PROBE_KEY in message)
    const sent = jsonOnlyPort.messages.filter((message) => message.messageType)
    expect(probes).toEqual([{ [STRUCTURED_CLONE_PROBE_KEY]: 1 }])
    expect(sent.map((message) => typeof message.message)).toEqual(['string', 'string'])
  })

  test('decodes raw and richJson parts from one incoming envelope', () => {
    const port = createPort('incoming', () => undefined)
    const messenger = new PortMessenger([port])
    const callback = jest.fn()
    messenger.addConnectListener('incoming', callback)

    port.onMessageListener!({
      messageType: '> ui',
      message: { method: TEST_METHOD, params: { amount: 1n } },
      meta: '{"windowId":2}'
    })

    expect(callback).toHaveBeenCalledWith(
      '> ui',
      { method: TEST_METHOD, params: { amount: 1n } },
      { windowId: 2 }
    )
  })
})
