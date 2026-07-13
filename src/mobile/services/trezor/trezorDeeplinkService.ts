import { Linking } from 'react-native'

import TrezorConnect from '@trezor/connect-mobile'

import { TREZOR_CONNECT_MANIFEST } from '@common/modules/hardware-wallet/constants/trezor'

// All Trezor communication on mobile happens HERE, in the React Native native
// JS context. Trezor has no supported way to talk to the device from inside our own process on mobile:
// the only official path is @trezor/connect-mobile, which deep-links into the
// Trezor Suite app — Suite owns the USB/Bluetooth connection, shows the
// on-device confirmation, and returns the signed result back to us via a deep
// link. The WebView worker (where the controllers live) can't open deep links,
// so the worker-side TrezorController forwards every SDK call to this singleton
// over the message bridge (see WebViewWorker.tsx `trezor.*` cases).

const CALLBACK_URL = 'ambire://trezor'

class TrezorDeeplinkService {
  #initPromise: Promise<void> | null = null

  #callbackUrl = CALLBACK_URL

  /** Idempotent: the SDK is initialized once and kept for the app's lifetime. */
  #ensureInit(): Promise<void> {
    if (this.#initPromise) return this.#initPromise

    this.#initPromise = (async () => {
      // The listener must be live before the first call opens Suite, so that
      // Suite's redirect back is handled. Other deep links (e.g. WalletConnect)
      // are ignored — only our callback path is forwarded to the SDK. Never
      // removed on purpose: this is an app-lifetime singleton and the listener
      // must stay live to receive Suite's redirect for every future sign.
      Linking.addEventListener('url', ({ url }) => {
        if (url.startsWith(CALLBACK_URL)) TrezorConnect.handleDeeplink(url)
      })

      await TrezorConnect.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        deeplinkOpen: async (url: string) => {
          try {
            await Linking.openURL(url)
          } catch {
            // Trezor Suite app is not installed / could not be opened — cancel the
            // in-flight call so its promise rejects with a clear message instead
            // of hanging until the user gives up.
            TrezorConnect.cancel(
              'Could not open the Trezor Suite app. Please install Trezor Suite and try again.'
            )
          }
        },
        deeplinkCallbackUrl: this.#callbackUrl
      })
    })()

    return this.#initPromise
  }

  /**
   * A `success: false` result that comes back through the Suite deep link means
   * the user cancelled in Suite — on mobile, genuine device/connection errors
   * never redirect back (they leave the promise hanging), so anything that DOES
   * return unsuccessfully is a cancellation. Suite sends it with an empty
   * payload (no `code`/`error`), which the shared error mapping would otherwise
   * render as the misleading "Could not connect to your Trezor device". Stamp a
   * clear cancel message so the signer surfaces the real reason. (Our own
   * cancel resolves with `success: undefined`, not `false`, and already carries
   * its own message, so it's untouched here.)
   */
  #normalizeDeeplinkFailure = (res: any): any => {
    if (res?.success !== false) return res

    const payload = res.payload || {}
    if (payload.code || payload.error || payload.message) return res

    return { ...res, payload: { ...payload, error: 'The request was cancelled in Trezor Suite.' } }
  }

  /**
   * Pure passthroughs: the params/response cross the worker bridge as JSON, and
   * the SDK methods are overloaded (e.g. getPublicKey has single/bundle forms)
   * which a single arrow can't satisfy — so these are typed loosely here. The
   * real argument/response typing is enforced where the shared TrezorSigner /
   * TrezorKeyIterator call `controller.walletSDK.*` (typed via TrezorWalletSDK).
   */
  ethereumGetAddress = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#normalizeDeeplinkFailure(await TrezorConnect.ethereumGetAddress(params))
  }

  getPublicKey = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#normalizeDeeplinkFailure(await TrezorConnect.getPublicKey(params))
  }

  ethereumSignTransaction = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#normalizeDeeplinkFailure(await TrezorConnect.ethereumSignTransaction(params))
  }

  ethereumSignTypedData = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#normalizeDeeplinkFailure(await TrezorConnect.ethereumSignTypedData(params))
  }

  ethereumSignMessage = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#normalizeDeeplinkFailure(await TrezorConnect.ethereumSignMessage(params))
  }

  /**
   * Cancels any in-flight deep-link call after an abandoned/rejected sign so the
   * next call starts clean (mirrors the extension's popup close). Best-effort.
   */
  signingCleanup = async (): Promise<void> => {
    TrezorConnect.cancel('Sign request cancelled by user')
  }
}

export default new TrezorDeeplinkService()
