import { Buffer } from 'buffer'

import { describe, expect, test } from '@jest/globals'
import { UR, URDecoder, UREncoder } from '@ngraveio/bc-ur'

import { UrFragmentDecoder } from './UrFragmentDecoder'

/** Deterministic, so a failing scan can be replayed */
const createRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

const createPayload = (size: number) =>
  Buffer.from(Array.from({ length: size }, (_, i) => (i * 31 + 7) % 256))

/**
 * Plays the animated QR code to the decoder the way a hand-held camera reads it: each code
 * is missed with the given chance. Returns how many codes were shown until it completed.
 */
const scan = (
  payload: Buffer,
  missRate: number,
  seed: number,
  decoder: { add: (fragment: string) => void; isComplete: () => boolean },
  onCode?: () => void
) => {
  const encoder = new UREncoder(new UR(payload, 'bytes'), 100)
  const random = createRandom(seed)
  let shown = 0

  while (!decoder.isComplete() && shown < 20_000) {
    const fragment = encoder.nextPart()
    shown += 1
    if (random() >= missRate) decoder.add(fragment)
    onCode?.()
  }

  return shown
}

describe('UrFragmentDecoder', () => {
  test('decodes a payload read in full on the first pass', () => {
    const payload = createPayload(3_000)
    const decoder = new UrFragmentDecoder()

    scan(payload, 0, 1, decoder)

    expect(Buffer.from(decoder.result())).toEqual(payload)
    expect(decoder.progress()).toBe(1)
  })

  test('decodes a single-part code', () => {
    const payload = createPayload(50)
    const decoder = new UrFragmentDecoder()

    decoder.add(new UREncoder(new UR(payload, 'bytes'), 100).nextPart())

    expect(decoder.isComplete()).toBe(true)
    expect(Buffer.from(decoder.result())).toEqual(payload)
  })

  test.each([
    [6_000, 0.5],
    [15_000, 0.2],
    [15_000, 0.5]
  ])(
    'decodes %d bytes with %d of the codes missed, no later than bc-ur alone',
    (size, missRate) => {
      const payload = createPayload(size)

      for (let seed = 1; seed <= 5; seed++) {
        const decoder = new UrFragmentDecoder()
        const shown = scan(payload, missRate, seed, decoder)

        const bcUr = new URDecoder()
        const shownToBcUr = scan(payload, missRate, seed, {
          add: (fragment) => bcUr.receivePart(fragment),
          isComplete: () => !!bcUr.isComplete()
        })

        expect(Buffer.from(decoder.result())).toEqual(payload)
        expect(shown).toBeLessThanOrEqual(shownToBcUr)
      }
    }
  )

  test('progress only grows and gets to the end only when the scan does', () => {
    const decoder = new UrFragmentDecoder()
    const readings: { progress: number; isComplete: boolean }[] = []

    scan(createPayload(15_000), 0.5, 3, decoder, () =>
      readings.push({ progress: decoder.progress(), isComplete: decoder.isComplete() })
    )

    readings.forEach(({ progress, isComplete }, i) => {
      expect(progress).toBeGreaterThanOrEqual(readings[i - 1]?.progress ?? 0)
      expect(progress === 1).toBe(isComplete)
    })
  })

  test('starts over after a reset', () => {
    const payload = createPayload(6_000)
    const decoder = new UrFragmentDecoder()

    scan(payload, 0.5, 2, decoder)
    decoder.reset()

    expect(decoder.isComplete()).toBe(false)
    expect(decoder.progress()).toBe(0)

    scan(payload, 0.5, 4, decoder)
    expect(Buffer.from(decoder.result())).toEqual(payload)
  })
})
