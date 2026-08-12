import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import {
  NfcControllerSignHashParams,
  NfcSignature
} from '@common/modules/hardware-wallets/nfc/types'

export interface NfcControllerInterface extends ExternalSignerController {
  signHash: (args: NfcControllerSignHashParams) => Promise<NfcSignature>
}
