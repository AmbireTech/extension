// common routes between the mobile app and the extension(web)
const COMMON_ROUTES = {
  keyStoreUnlock: 'unlock',
  dashboard: 'dashboard',
  getStarted: 'get-started',
  networksConfiguration: 'networks-configuration',
  privacyOptOutsConfiguration: 'privacy-opt-outs-configuration',
  importPrivateKey: 'import-private-key',
  importSmartAccountJson: 'import-smart-account-json',
  importSeedPhrase: 'import-recovery-phrase',
  importExistingAccount: 'import-existing-account',
  createSeedPhrasePrepare: 'create-new-recovery-phrase',
  createSeedPhraseWrite: 'backup-recovery-phrase',
  ledgerConnect: 'ledger-connect',
  keyStoreSetup: 'set-extension-password',
  accountPersonalize: 'account-personalize',
  accountPicker: 'account-picker',
  onboardingCompleted: 'wallet-setup-completed',
  viewOnlyAccountAdder: 'view-only-account-adder',
  safeImport: 'safe-import',
  qrConnect: 'qr-connect',
  transfer: 'transfer',
  topUpGasTank: 'top-up-gas-tank',
  tokenDetails: 'token-details',
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
  qrReader: 'qr-reader'
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
  // INTERNAL ROUTES
  internalLogs: 'internal/logs'
}

const ROUTES = { ...MOBILE_ROUTES, ...WEB_ROUTES }

const ONBOARDING_WEB_ROUTES = [
  COMMON_ROUTES.getStarted,
  COMMON_ROUTES.createSeedPhrasePrepare,
  COMMON_ROUTES.createSeedPhraseWrite,
  COMMON_ROUTES.importExistingAccount,
  COMMON_ROUTES.importPrivateKey,
  COMMON_ROUTES.importSeedPhrase,
  COMMON_ROUTES.importSmartAccountJson,
  COMMON_ROUTES.viewOnlyAccountAdder,
  COMMON_ROUTES.ledgerConnect,
  COMMON_ROUTES.keyStoreSetup,
  COMMON_ROUTES.accountPersonalize,
  COMMON_ROUTES.accountPicker,
  COMMON_ROUTES.onboardingCompleted,
  COMMON_ROUTES.safeImport,
  COMMON_ROUTES.qrConnect
] as const

export { MOBILE_ROUTES, ONBOARDING_WEB_ROUTES, ROUTES, WEB_ROUTES }
