import { EmitterSubscription, Linking } from 'react-native'

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

// Absolute backstop for a call whose result never arrives. Trezor Suite sends NO
// callback when the user rejects/cancels on the device (verified in trezor-suite:
// the reject path lands in the `call-error` state, which its deeplinkCallback
// reducer never redirects from), and connect-mobile has no timeout — so the
// promise would otherwise hang for the app's lifetime. We deliberately do NOT
// auto-cancel when the app returns to the foreground: that can't tell a genuine
// reject from the user briefly switching back to Ambire before confirming in
// Suite, and would wrongly kill a still-valid request. The user cancels
// explicitly via the signing modal's "Cancel request" button; this timeout is
// only the last-resort net. Generous so it never cuts off a slow confirmation —
// MetaMask/WalletConnect use similar multi-minute request expiries.
const CALL_TIMEOUT_MS = 5 * 60 * 1000

class TrezorDeeplinkService {
  #initPromise: Promise<void> | null = null

  #deeplinkSubscription: EmitterSubscription | null = null

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

  // A `success: false` result that comes back through the Suite deep link means
  // the user cancelled in Suite — on mobile, genuine device/connection errors
  // never redirect back (they leave the promise hanging), so anything that DOES
  // return unsuccessfully is a cancellation. Suite sends it with an empty
  // payload (no `code`/`error`), which the shared error mapping would otherwise
  // render as the misleading "Could not connect to your Trezor device". Stamp a
  // clear cancel message so the signer surfaces the real reason. (Our own
  // cancel/timeout resolves with `success: undefined`, not `false`, and already
  // carries its own message, so it's untouched here.)
  #normalizeDeeplinkFailure = (res: any): any => {
    if (res?.success !== false) return res

    const payload = res.payload || {}
    if (payload.code || payload.error || payload.message) return res

    return { ...res, payload: { ...payload, error: 'The request was cancelled in Trezor Suite.' } }
  }

  // Arms an absolute timeout so a call can never hang for the app's lifetime if
  // its result never arrives (see CALL_TIMEOUT_MS). The cancel is a no-op once
  // the call has settled.
  #track<T>(promise: Promise<T>): Promise<T> {
    const timeout = setTimeout(() => {
      TrezorConnect.cancel('The Trezor request timed out. Please try again.')
    }, CALL_TIMEOUT_MS)

    return promise
      .then((res) => this.#normalizeDeeplinkFailure(res))
      .finally(() => {
        clearTimeout(timeout)
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
