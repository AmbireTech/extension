import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import type { TrezorConnect } from '@trezor/connect/lib/types'

// The subset of the Trezor Connect SDK that the shared TrezorSigner and
// TrezorKeyIterator actually call. On the extension this is the real
// @trezor/connect-webextension SDK; on mobile it's a bridge shim that forwards
// each call to the native deep-link service (trezorDeeplinkService) and returns
// the same { success, payload } response shapes.
export type TrezorWalletSDK = Pick<
  TrezorConnect,
  | 'ethereumGetAddress'
  | 'getPublicKey'
  | 'ethereumSignTransaction'
  | 'ethereumSignTypedData'
  | 'ethereumSignMessage'
>

// Shape shared by the web (connect-webextension) and mobile (native-bridged)
// TrezorController implementations, letting TrezorSigner + TrezorKeyIterator
// stay in common without depending on either environment's SDK wiring.
export interface TrezorControllerInterface extends ExternalSignerController {
  walletSDK: TrezorWalletSDK
  isInitiated: boolean
  initialLoadPromise: Promise<void>
  signingCleanup: () => Promise<void>
}
