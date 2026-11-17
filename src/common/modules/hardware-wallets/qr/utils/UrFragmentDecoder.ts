import { Buffer } from 'buffer'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { URDecoder } from '@ngraveio/bc-ur'

/** A part the decoder holds or has resolved: the XOR of the fragments it covers */
type DecoderPart = { indexes: number[]; fragment: Buffer }

/**
 * The parts of bc-ur's fountain decoder this class reads and feeds. It keeps them private,
 * so they are typed here instead.
 */
type FountainDecoderInternals = {
  mixedParts: { value: DecoderPart }[]
  simpleParts: { value: DecoderPart }[]
  processSimplePart: (part: DecoderPart & { isSimple: () => boolean }) => void
  isSuccess: () => boolean
  isFailure: () => boolean
  resultMessage: () => Buffer
}

/** A held part reduced to the fragments it still has unknown, keyed by the lowest of them */
type Pivot = { indexes: Set<number>; fragment: Buffer }

const xorInto = (target: Buffer, source: Buffer) => {
  for (let i = 0; i < target.length; i++) target[i]! ^= source[i]!
}

/**
 * Eliminates the held parts against each other, the same way the fragments themselves are
 * recovered, so that two parts saying the same thing count once. Each pivot that is left
 * pins down one more fragment, so once there is one for every missing fragment the payload
 * is fully known.
 */
const reduceHeldParts = (held: DecoderPart[], resolved: Map<number, Buffer>) => {
  const pivots = new Map<number, Pivot>()

  held.forEach(({ indexes: partIndexes, fragment: partFragment }) => {
    const fragment = Buffer.from(partFragment)
    let indexes = new Set<number>()
    partIndexes.forEach((index) => {
      const resolvedFragment = resolved.get(index)
      if (resolvedFragment) xorInto(fragment, resolvedFragment)
      else indexes.add(index)
    })

    while (indexes.size) {
      const pivotIndex = Math.min(...indexes)
      const pivot = pivots.get(pivotIndex)

      if (!pivot) {
        pivots.set(pivotIndex, { indexes, fragment })
        return
      }

      // Both cover the pivot, so all this part adds is whatever the two of them differ by
      const reduced = new Set(indexes)
      pivot.indexes.forEach((index) =>
        reduced.has(index) ? reduced.delete(index) : reduced.add(index)
      )
      indexes = reduced
      xorInto(fragment, pivot.fragment)
    }
  })

  return pivots
}

export class UrFragmentDecoder {
  private decoder = new URDecoder()

  /**
   * The decoder keeps no public account of the parts it is holding, so they are read from
   * its own state, which a later version of it may no longer have.
   */
  private get fountainDecoder(): FountainDecoderInternals | undefined {
    const fountainDecoder = (this.decoder as any).fountainDecoder
    if (!Array.isArray(fountainDecoder?.mixedParts) || !Array.isArray(fountainDecoder.simpleParts))
      return undefined

    return fountainDecoder
  }

  private getResolvedFragments(fountainDecoder: FountainDecoderInternals) {
    return new Map(
      fountainDecoder.simpleParts.map(({ value }) => [value.indexes[0]!, value.fragment])
    )
  }

  /**
   * bc-ur only takes a held part apart once all but one of its fragments are known, so the
   * end of a scan used to wait for a lucky code even though the parts in hand already pin
   * every fragment down. In that case the missing fragments are worked out here and handed
   * to it, which then reassembles the payload and verifies its checksum as usual.
   */
  private solveIfPinnedDown() {
    const fountainDecoder = this.fountainDecoder
    const expectedParts = this.expectedPartCount()
    if (!fountainDecoder || !expectedParts) return

    const resolved = this.getResolvedFragments(fountainDecoder)
    const held = fountainDecoder.mixedParts.map(({ value }) => value)
    // Every missing fragment needs a part of its own, so there is nothing to solve yet
    if (resolved.size + held.length < expectedParts) return

    const pivots = reduceHeldParts(held, resolved)
    if (resolved.size + pivots.size < expectedParts) return

    // Each pivot only covers fragments past its own, so working down from the last one
    // finds every other fragment of it already solved
    const solved = new Map<number, Buffer>()
    Array.from(pivots.keys())
      .sort((a, b) => b - a)
      .forEach((pivotIndex) => {
        const { indexes, fragment } = pivots.get(pivotIndex)!
        indexes.forEach((index) => index !== pivotIndex && xorInto(fragment, solved.get(index)!))
        solved.set(pivotIndex, fragment)
      })

    solved.forEach((fragment, index) =>
      fountainDecoder.processSimplePart({ indexes: [index], fragment, isSimple: () => true })
    )

    if (fountainDecoder.isFailure()) throw new ExternalSignerError('Failed to decode UR payload.')
  }

  add(fragment: string) {
    this.decoder.receivePart(fragment)

    if (!this.isComplete()) this.solveIfPinnedDown()
  }

  isComplete() {
    return !!this.decoder.isComplete() || !!this.fountainDecoder?.isSuccess()
  }

  /**
   * How many fragments the whole payload was split into, which the first fragment that
   * arrives already tells. 0 until then.
   */
  expectedPartCount() {
    return this.decoder.expectedPartCount()
  }

  /**
   * How much of the payload is in, from 0 to 1.
   *
   * Past the first pass every animated code carries an XOR of several fragments, which the
   * decoder holds on to until the missing pieces let it take them apart. This counts what
   * those parts pin down between them, and the payload is solved as soon as they pin down
   * all of it, so the progress only gets to the end when the scan does.
   */
  progress() {
    const expectedParts = this.expectedPartCount()
    if (!expectedParts) return 0

    const fountainDecoder = this.fountainDecoder
    // Falls back to the resolved fragments alone should a later version of bc-ur drop them
    if (!fountainDecoder) return this.decoder.receivedPartIndexes().length / expectedParts

    const resolved = this.getResolvedFragments(fountainDecoder)
    const pivots = reduceHeldParts(
      fountainDecoder.mixedParts.map(({ value }) => value),
      resolved
    )

    return Math.min((resolved.size + pivots.size) / expectedParts, 1)
  }

  result(): Uint8Array {
    const ur = this.decoder.resultUR()
    if (ur?.cbor?.length) return ur.cbor

    // Solved here rather than by bc-ur, so the UR around the payload was never built
    const fountainDecoder = this.fountainDecoder
    if (fountainDecoder?.isSuccess()) return fountainDecoder.resultMessage()

    throw new ExternalSignerError('Failed to decode UR payload.')
  }

  reset() {
    this.decoder = new URDecoder()
  }
}
