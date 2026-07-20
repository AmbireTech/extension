import { stringify } from '@ambire-common/libs/richJson/richJson'

import {
  deserializeMessagePart,
  detectStructuredCloneSupport,
  STRUCTURED_CLONE_PROBE_KEY
} from './messageSerialization'

describe('detectStructuredCloneSupport', () => {
  test('reports true when the port accepts a BigInt (structured clone)', () => {
    // A structured-clone channel serializes BigInt without throwing.
    const received: any[] = []
    const post = (msg: any) => received.push(msg)

    expect(detectStructuredCloneSupport(post)).toBe(true)
    // The probe carries a BigInt under the inert probe key and no messageType.
    expect(received).toHaveLength(1)
    expect(received[0][STRUCTURED_CLONE_PROBE_KEY]).toBe(BigInt(1))
    expect(received[0].messageType).toBeUndefined()
  })

  test('reports false when the port rejects a BigInt (JSON serialization)', () => {
    // Mimics chrome.runtime JSON serialization, which throws on BigInt.
    const post = (msg: any) => {
      JSON.stringify(msg)
    }

    expect(detectStructuredCloneSupport(post)).toBe(false)
  })

  test('reports false when the port throws for any reason', () => {
    const post = () => {
      throw new Error('Could not serialize message')
    }

    expect(detectStructuredCloneSupport(post)).toBe(false)
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
