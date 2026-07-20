// Shared by the web (connect-webextension) and mobile (connect-mobile deep-link)
// Trezor SDK init. The same app identity is shown in the Trezor consent popup /
// Trezor Suite regardless of environment, so keep one source of truth.
export const TREZOR_CONNECT_MANIFEST = {
  email: 'wallet@ambire.com',
  appUrl: 'https://ambire.com',
  appName: 'Ambire',
  appIcon: 'https://www.ambire.com/ambire-trezor-connect-icon-light.png'
}
