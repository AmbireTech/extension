// common routes between the mobile app and the extension(web)
const COMMON_ROUTES = {
  keyStoreUnlock: 'unlock',
  dashboard: 'dashboard',
  getStarted: 'get-started',
  // Side panel cannot render the full tab-only onboarding flow; this route is the placeholder
  // shown when there are no accounts in the side panel.
  sidePanelNoAccounts: 'side-panel-no-accounts',
  networksConfiguration: 'networks-configuration',
  privacyOptOutsConfiguration: 'privacy-opt-outs-configuration',
  importPrivateKey: 'import-private-key',
  importSmartAccountJson: 'import-smart-account-json',
  importSeedPhrase: 'import-recovery-phrase',
  importExistingAccount: 'import-existing-account',
  ledgerConnect: 'ledger-connect',
  trezorConnect: 'trezor-connect',
  keyStoreSetup: 'set-extension-password',
  accountPersonalize: 'account-personalize',
  accountPicker: 'account-picker',
  onboardingCompleted: 'wallet-setup-completed',
  viewOnlyAccountAdder: 'view-only-account-adder',
  safeImport: 'safe-import',
  safeImportAddress: 'safe-import-address',
  safeImportByOwner: 'safe-import-by-owner',
  qrConnect: 'qr-connect',
  transfer: 'transfer',
  topUpGasTank: 'top-up-gas-tank',
  tokenDetails: 'token-details',
  trendingTokens: 'trending-tokens',
  trendingTokenDetails: 'trending-token-details',
  accountSelect: 'account-select',
  receive: 'receive',
  signAccountOp: 'sign-account-op',
  benzin: 'benzin',
  networks: 'networks',
  swapAndBridge: 'swap-and-bridge',
  menu: 'menu',
  generalSettings: 'settings/general',
  accountsSettings: 'settings/accounts',
  networksSettings: 'settings/networks',
  settingsAbout: 'settings/about',
  settingsTerms: 'settings/terms',
  explore: 'explore',
  exploreSection: 'explore/section',
  signMessage: 'sign-message',
  addChain: 'add-chain',
  watchAsset: 'watch-asset',
  switchAccount: 'switch-account',
  getEncryptionPublicKeyRequest: 'get-encryption-public-key-request',
  decryptRequest: 'decryptRequest'
}

const MOBILE_ROUTES = {
  ...COMMON_ROUTES,
  dappWebView: 'explore/webview',
  qrReader: 'qr-reader',
  migrationOnboarding: 'migration-onboarding',
  importAccountsFromExtension: 'import-accounts-from-extension'
}

const WEB_ROUTES = {
  ...COMMON_ROUTES,
  rewards: 'rewards',
  earn: 'earn',
  transactions: 'transactions',
  signedMessages: 'signed-messages',
  swap: 'swap',
  noConnection: 'no-connection',
  accounts: 'accounts',
  keyStoreEmailRecovery: 'extension-password-email-recovery',
  keyStoreEmailRecoverySetNewPassword: 'set-new-extension-password',
  dappConnectRequest: 'dapp-connect-request',
  authEmailAccount: 'auth-email-account',
  authEmailLogin: 'auth-email-login',
  authEmailRegister: 'auth-email-register',
  devicePasswordSet: 'settings/device-password-set',
  devicePasswordChange: 'settings/device-password-change',
  devicePasswordRecovery: 'settings/device-password-recovery',
  addressBook: 'settings/address-book',
  manageTokens: 'settings/manage-tokens',
  recoveryPhrasesSettings: 'settings/recovery-phrases',
  safeImport: 'safe-import',
  optOuts: 'settings/opt-outs',
  survey: 'survey',
  qrPermission: 'qr-permission',
  exportAccountsToMobile: 'export-accounts-to-mobile',
  importAccountsFromMobile: 'import-accounts-from-mobile',
  // INTERNAL ROUTES
  internalLogs: 'internal/logs'
}

const ROUTES = { ...MOBILE_ROUTES, ...WEB_ROUTES }

/**
 * The paths a mobile navigation stack resets to: the app root and the two screens
 * the route guards redirect to. Reaching one of them means the flow starts over,
 * so there is nothing left to go back to. Pathnames, hence the leading slash.
 */
const MOBILE_ROOT_ROUTE_PATHS = [
  '/',
  `/${COMMON_ROUTES.dashboard}`,
  `/${COMMON_ROUTES.keyStoreUnlock}`,
  `/${COMMON_ROUTES.getStarted}`
]

/**
 * Location state marking a navigation that means "back" although it is performed
 * as a push or a replace: some flows return to the previous step, or send the user
 * home, instead of popping (the onboarding steps, the "go home" back buttons, the
 * in-app browser leaving for the apps catalog). The mobile stack reads it to
 * animate the transition backwards - other environments ignore it.
 */
const BACK_NAVIGATION_STATE = { navDirection: 'back' } as const

/**
 * Location state marking a navigation as a step *forward* onto a screen that is
 * already in the stack, so the mobile stack puts a second one on top instead of
 * revealing the one it has - what react-navigation's `push` does, as opposed to
 * its `navigate`. Only a flow that deliberately re-enters an earlier screen needs
 * it (the account personalize screen opens the account picker it may have come
 * from). Other environments ignore it.
 */
const FORWARD_NAVIGATION_STATE = { navDirection: 'forward' } as const

/**
 * Landing on one of these means the app took the user out of the wallet - the
 * keystore locked, or the last account was removed - rather than moving them
 * forward. The mobile stack animates the transition backwards, the way
 * react-navigation's `animationTypeForReplace: 'pop'` does. Pathnames, hence the
 * leading slash.
 */
const MOBILE_BACKWARDS_ROUTE_PATHS = [
  `/${COMMON_ROUTES.keyStoreUnlock}`,
  `/${COMMON_ROUTES.getStarted}`
]

const ONBOARDING_WEB_ROUTES = [
  COMMON_ROUTES.getStarted,
  COMMON_ROUTES.importExistingAccount,
  COMMON_ROUTES.importPrivateKey,
  COMMON_ROUTES.importSeedPhrase,
  COMMON_ROUTES.importSmartAccountJson,
  COMMON_ROUTES.viewOnlyAccountAdder,
  COMMON_ROUTES.ledgerConnect,
  COMMON_ROUTES.trezorConnect,
  COMMON_ROUTES.keyStoreSetup,
  COMMON_ROUTES.accountPersonalize,
  COMMON_ROUTES.accountPicker,
  COMMON_ROUTES.onboardingCompleted,
  COMMON_ROUTES.safeImport,
  COMMON_ROUTES.safeImportAddress,
  COMMON_ROUTES.safeImportByOwner,
  COMMON_ROUTES.qrConnect,
  WEB_ROUTES.importAccountsFromMobile,
  MOBILE_ROUTES.importAccountsFromExtension
] as const

export {
  BACK_NAVIGATION_STATE,
  FORWARD_NAVIGATION_STATE,
  MOBILE_BACKWARDS_ROUTE_PATHS,
  MOBILE_ROOT_ROUTE_PATHS,
  MOBILE_ROUTES,
  ONBOARDING_WEB_ROUTES,
  ROUTES,
  WEB_ROUTES
}
