import { IS_FIREFOX } from '@web/constants/common'

/** Chrome Web Store listing of the Ambire browser extension. */
export const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/ambire-wallet/ehgjhhccekdedpbkifaojjaefeohnoea'

/** Firefox Add-ons listing of the Ambire browser extension. */
export const FIREFOX_ADD_ONS_URL =
  'https://addons.mozilla.org/en-US/firefox/addon/ambire-web3-wallet'

/**
 * Reviews page of the extension listing in the store of the browser it runs in.
 */
export const EXTENSION_STORE_REVIEWS_URL = `${
  IS_FIREFOX ? FIREFOX_ADD_ONS_URL : CHROME_WEB_STORE_URL
}/reviews`
