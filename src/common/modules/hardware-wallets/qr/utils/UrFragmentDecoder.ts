import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { URDecoder } from '@ngraveio/bc-ur'

/**
 * The data can be all in while the decoder still needs a fragment it can take apart, so the
 * progress below is kept just short of the end until the payload really is complete.
 */
const MAX_PROGRESS = 0.99

/**
 * How much of the progress leans on the fragments that are decoded rather than on the ones
 * the held parts pin down. The two agree for most of a scan, but the data can be all in a
 * moment before the decoder has a part it can take apart, and this keeps the bar creeping
 * through that moment instead of parking at the very end waiting for it.
 */
const DECODED_WEIGHT = 0.15

/** A part the decoder is holding on to, which stands for the XOR of the fragments it covers */
type HeldPart = { value?: { indexes?: number[] } }

/**
 * How many fragments a set of held parts pins down between them. Two parts covering the same
 * fragments say the same thing twice, so what counts is how many of their fragment sets are
 * independent of one another - which is what is left after eliminating them against each
 * other, the same way the fragments themselves are recovered.
 */
const countIndependentParts = (held: HeldPart[], resolved: Set<number>) => {
  const pivots = new Map<number, Set<number>>()
  let independent = 0

  held.forEach(({ value }) => {
    let indexes = new Set((value?.indexes || []).filter((index) => !resolved.has(index)))

    while (indexes.size) {
      const pivot = Math.min(...indexes)
      const pivotIndexes = pivots.get(pivot)

      if (!pivotIndexes) {
        pivots.set(pivot, indexes)
        independent += 1
        break
      }

      // Both cover the pivot, so all this part adds is whatever the two of them differ by
      const reduced = new Set(indexes)
      pivotIndexes.forEach((index) =>
        reduced.has(index) ? reduced.delete(index) : reduced.add(index)
      )
      indexes = reduced
    }
  })

  return independent
}

export class UrFragmentDecoder {
  private decoder = new URDecoder()

  add(fragment: string) {
    this.decoder.receivePart(fragment)
  }

  isComplete() {
    return this.decoder.isComplete()
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
   * decoder holds on to until the missing pieces let it take them apart - so the tail of a
   * scan comes apart all at once. Counting only the fragments it resolved therefore sits at
   * a fraction of the truth for most of the scan, while counting the parts it holds runs
   * ahead of it (many carry nothing the others don't). This measures what those parts pin
   * down between them, which tracks the scan itself.
   */
  progress() {
    const expectedParts = this.expectedPartCount()

    if (!expectedParts) return 0

    const resolved = new Set(this.decoder.receivedPartIndexes())
    // The decoder keeps no public account of the parts it is holding, so this reads its own
    // state, falling back to the resolved fragments alone should a later version drop it
    const held: HeldPart[] = (this.decoder as any).fountainDecoder?.mixedParts || []

    const decodedShare = resolved.size / expectedParts
    const pinnedDownShare = (resolved.size + countIndependentParts(held, resolved)) / expectedParts

    return Math.min(
      pinnedDownShare * (1 - DECODED_WEIGHT) + decodedShare * DECODED_WEIGHT,
      MAX_PROGRESS
    )
  }

  result(): Uint8Array {
    const ur = this.decoder.resultUR()

    if (!ur?.cbor) {
      throw new ExternalSignerError('Failed to decode UR payload.')
    }

    return ur.cbor
  }

  reset() {
    this.decoder = new URDecoder()
  }
}
