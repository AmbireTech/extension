import { AppState, EmitterSubscription, Linking, NativeEventSubscription } from 'react-native'

import TrezorConnect from '@trezor/connect-mobile'

// All Trezor communication on mobile happens HERE, in the React Native native
// JS context. Unlike Ledger (whose DMK transport we drive directly), Trezor has
// no supported way to talk to the device from inside our own process on mobile:
// the only official path is @trezor/connect-mobile, which deep-links into the
// Trezor Suite Lite app — Suite owns the USB/Bluetooth connection, shows the
// on-device confirmation, and returns the signed result back to us via a deep
// link. The WebView worker (where the controllers live) can't open deep links,
// so the worker-side TrezorController forwards every SDK call to this singleton
// over the message bridge (see WebViewWorker.tsx `trezor.*` cases).
//
// The connect SDK RESOLVES with a `{ success, payload }` response object on
// device errors (it does not throw), so these methods return that object
// verbatim across the bridge; the shared TrezorSigner / TrezorKeyIterator read
// `res.success` and humanize `res.payload.code` themselves.

const TREZOR_CONNECT_MANIFEST = {
  email: 'wallet@ambire.com',
  appUrl: 'https://ambire.com',
  appName: 'Ambire',
  appIcon: 'https://www.ambire.com/ambire-trezor-connect-icon-light.png'
}

// The deep link Suite Lite redirects back to once it has a result. Use the app's
// literal `ambire://` scheme (like WalletConnect's `ambire://wc`) — NOT
// expo-linking's createURL, because app.json has no `scheme` set, so createURL
// can't produce a resolvable ambire:// URL and Suite's redirect back would fail
// (leaving Ambire stuck on the account-picker spinner). The `trezor` host keeps
// it distinct from the WalletConnect `wc` deep links.
const CALLBACK_URL = 'ambire://trezor'

// Trezor Suite deep-links back to us on approval but NOT on reject/cancel — it
// just stays on its own screen. So when the user returns to Ambire with a call
// still in flight, we treat it as a cancellation. This grace window lets an
// in-flight approval callback (which arrives right as the app becomes active)
// resolve first, so we only cancel genuine rejects/abandons.
const RETURN_CANCEL_GRACE_MS = 1500

class TrezorDeeplinkService {
  #initPromise: Promise<void> | null = null

  #deeplinkSubscription: EmitterSubscription | null = null

  #appStateSubscription: NativeEventSubscription | null = null

  // Number of SDK calls awaiting a Suite deep-link response.
  #pendingCalls = 0

  #callbackUrl = CALLBACK_URL

  // Idempotent: the SDK is initialized once and kept for the app's lifetime.
  #ensureInit(): Promise<void> {
    if (this.#initPromise) return this.#initPromise

    this.#initPromise = (async () => {
      // The listener must be live before the first call opens Suite, so that
      // Suite's redirect back is handled. Other deep links (e.g. WalletConnect)
      // are ignored — only our callback path is forwarded to the SDK.
      this.#deeplinkSubscription = Linking.addEventListener('url', ({ url }) => {
        if (url.startsWith(CALLBACK_URL)) TrezorConnect.handleDeeplink(url)
      })

      // Reject-in-Suite fallback: Suite sends no callback on cancel, so the only
      // signal is the user coming back to Ambire with a call unresolved.
      this.#appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state !== 'active' || this.#pendingCalls === 0) return
        setTimeout(() => {
          // If an approval callback resolved the call in the meantime, #pendingCalls
          // is already 0 and this is a no-op.
          if (this.#pendingCalls > 0)
            TrezorConnect.cancel('The request was cancelled in Trezor Suite.')
        }, RETURN_CANCEL_GRACE_MS)
      })

      await TrezorConnect.init({
        manifest: TREZOR_CONNECT_MANIFEST,
        deeplinkOpen: async (url: string) => {
          try {
            await Linking.openURL(url)
          } catch {
            // Suite Lite is not installed / could not be opened — cancel the
            // in-flight call so its promise rejects with a clear message instead
            // of hanging until the user gives up.
            TrezorConnect.cancel(
              'Could not open the Trezor Suite app. Please install Trezor Suite Lite and try again.'
            )
          }
        },
        deeplinkCallbackUrl: this.#callbackUrl
      })
    })()

    return this.#initPromise
  }

  // Counts a call as in-flight while it awaits a Suite deep-link response, so the
  // AppState fallback can cancel it if the user returns after rejecting.
  #track<T>(promise: Promise<T>): Promise<T> {
    this.#pendingCalls += 1
    return promise.finally(() => {
      this.#pendingCalls -= 1
    })
  }

  // Pure passthroughs: the params/response cross the worker bridge as JSON, and
  // the SDK methods are overloaded (e.g. getPublicKey has single/bundle forms)
  // which a single arrow can't satisfy — so these are typed loosely here. The
  // real argument/response typing is enforced where the shared TrezorSigner /
  // TrezorKeyIterator call `controller.walletSDK.*` (typed via TrezorWalletSDK).
  ethereumGetAddress = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#track(TrezorConnect.ethereumGetAddress(params))
  }

  getPublicKey = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#track(TrezorConnect.getPublicKey(params))
  }

  ethereumSignTransaction = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#track(TrezorConnect.ethereumSignTransaction(params))
  }

  ethereumSignTypedData = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#track(TrezorConnect.ethereumSignTypedData(params))
  }

  ethereumSignMessage = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return this.#track(TrezorConnect.ethereumSignMessage(params))
  }

  // Cancels any in-flight deep-link call after an abandoned/rejected sign so the
  // next call starts clean (mirrors the extension's popup close). Best-effort.
  signingCleanup = async (): Promise<void> => {
    TrezorConnect.cancel('Operation cancelled by user')
  }
}

export default new TrezorDeeplinkService()
