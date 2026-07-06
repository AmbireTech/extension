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

  // Pure passthroughs: the params/response cross the worker bridge as JSON, and
  // the SDK methods are overloaded (e.g. getPublicKey has single/bundle forms)
  // which a single arrow can't satisfy — so these are typed loosely here. The
  // real argument/response typing is enforced where the shared TrezorSigner /
  // TrezorKeyIterator call `controller.walletSDK.*` (typed via TrezorWalletSDK).
  ethereumGetAddress = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return TrezorConnect.ethereumGetAddress(params)
  }

  getPublicKey = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return TrezorConnect.getPublicKey(params)
  }

  ethereumSignTransaction = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return TrezorConnect.ethereumSignTransaction(params)
  }

  ethereumSignTypedData = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return TrezorConnect.ethereumSignTypedData(params)
  }

  ethereumSignMessage = async (params: any): Promise<any> => {
    await this.#ensureInit()
    return TrezorConnect.ethereumSignMessage(params)
  }

  // Cancels any in-flight deep-link call after an abandoned/rejected sign so the
  // next call starts clean (mirrors the extension's popup close). Best-effort.
  signingCleanup = async (): Promise<void> => {
    TrezorConnect.cancel('Operation cancelled by user')
  }
}

export default new TrezorDeeplinkService()
