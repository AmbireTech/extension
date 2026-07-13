import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { URDecoder } from '@ngraveio/bc-ur'

export class UrFragmentDecoder {
  private decoder = new URDecoder()

  add(fragment: string) {
    this.decoder.receivePart(fragment)
  }

  isComplete() {
    return this.decoder.isComplete()
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
