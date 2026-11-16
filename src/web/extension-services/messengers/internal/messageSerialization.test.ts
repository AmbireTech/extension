const mockLogInfoWithPrefix = jest.fn()
const mockLogWarnWithPrefix = jest.fn()

jest.mock('@common/utils/logger', () => ({
  logInfoWithPrefix: mockLogInfoWithPrefix,
  logWarnWithPrefix: mockLogWarnWithPrefix
}))

import { stringify } from '@ambire-common/libs/richJson/richJson'

import {
  deserializeMessagePart,
  detectStructuredCloneSupport,
  isStructuredCloneEnabled,
  STRUCTURED_CLONE_PROBE_KEY
} from './messageSerialization'

describe('detectStructuredCloneSupport', () => {
  beforeEach(() => {
    mockLogInfoWithPrefix.mockClear()
    mockLogWarnWithPrefix.mockClear()
  })

  test('reports supported when the port accepts a BigInt (structured clone)', () => {
    // A structured-clone channel serializes BigInt without throwing.
    const received: any[] = []
    const post = (msg: any) => received.push(msg)

    expect(detectStructuredCloneSupport(post)).toBe('supported')
    // The probe carries a BigInt under the inert probe key and no messageType.
    expect(received).toHaveLength(1)
    expect(received[0][STRUCTURED_CLONE_PROBE_KEY]).toBe(BigInt(1))
    expect(received[0].messageType).toBeUndefined()
    expect(mockLogInfoWithPrefix).toHaveBeenCalledWith(
      'portMessenger',
      'structured clone support detected'
    )
    expect(mockLogWarnWithPrefix).not.toHaveBeenCalled()
  })

  test('reports unsupported when only the BigInt probe is rejected (JSON serialization)', () => {
    // Mimics chrome.runtime JSON serialization, which throws on BigInt.
    const received: any[] = []
    const post = (msg: any) => {
      JSON.stringify(msg)
      received.push(msg)
    }

    expect(detectStructuredCloneSupport(post)).toBe('unsupported')
    // The follow-up probe is inert as well, so a UI listener ignores it.
    expect(received).toEqual([{ [STRUCTURED_CLONE_PROBE_KEY]: 1 }])
    console.log('logged for an unsupported port', mockLogInfoWithPrefix.mock.calls)
    expect(mockLogInfoWithPrefix).toHaveBeenCalledWith(
      'portMessenger',
      'structured clone support not detected',
      expect.any(TypeError)
    )
    expect(mockLogWarnWithPrefix).not.toHaveBeenCalled()
  })

  test('reports portFailed when the port throws on any message, as a disconnected one does', () => {
    const post = () => {
      throw new Error('Attempting to use a disconnected port object')
    }

    expect(detectStructuredCloneSupport(post)).toBe('portFailed')
    console.log('logged for a failed port', mockLogWarnWithPrefix.mock.calls)
    expect(mockLogWarnWithPrefix).toHaveBeenCalledWith(
      'portMessenger',
      'could not probe structured clone support, the port failed to send',
      expect.objectContaining({ message: 'Attempting to use a disconnected port object' })
    )
    expect(mockLogInfoWithPrefix).not.toHaveBeenCalled()
  })
})

describe('isStructuredCloneEnabled', () => {
  test('requires the generated manifest opt-in', () => {
    expect(isStructuredCloneEnabled({ message_serialization: 'structured_clone' })).toBe(true)
    expect(isStructuredCloneEnabled({})).toBe(false)
    expect(isStructuredCloneEnabled({ message_serialization: 'json' })).toBe(false)
  })
})

describe('deserializeMessagePart', () => {
  test('parses a richJson string coming from the JSON path', () => {
    const original = { method: 'MainController', params: { balance: BigInt(42), nested: [1, 2] } }
    const encoded = stringify(original)

    expect(typeof encoded).toBe('string')
    expect(deserializeMessagePart(encoded)).toEqual(original)
  })

  test('restores BigInt values encoded by richJson', () => {
    const decoded = deserializeMessagePart(stringify({ amount: BigInt('9007199254740993') }))

    expect(decoded.amount).toBe(BigInt('9007199254740993'))
  })

  test('passes a raw object through untouched (structured clone path)', () => {
    const raw = { method: 'MainController', params: { balance: BigInt(42) } }

    // Same reference: no re-parsing happens on the structured clone path.
    expect(deserializeMessagePart(raw)).toBe(raw)
  })

  test('passes an empty object meta through untouched', () => {
    const meta = {}

    expect(deserializeMessagePart(meta)).toBe(meta)
  })
})
