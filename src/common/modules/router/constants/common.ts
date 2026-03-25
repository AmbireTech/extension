// common routes between the mobile app and the extension(web)
const COMMON_ROUTES = {
  keyStoreUnlock: 'unlock',
  dashboard: 'dashboard',
  getStarted: 'get-started',
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
  generalSettings: 'settings/general'
}

const MOBILE_ROUTES = {
  ...COMMON_ROUTES
}

const WEB_ROUTES = {
  ...COMMON_ROUTES,
  rewards: 'rewards',
  earn: 'earn',
  transactions: 'transactions',
  signedMessages: 'signed-messages',
  signMessage: 'sign-message',
  swap: 'swap',
  noConnection: 'no-connection',
  accounts: 'accounts',
  apps: 'apps',
  keyStoreEmailRecovery: 'extension-password-email-recovery',
  keyStoreEmailRecoverySetNewPassword: 'set-new-extension-password',
  getEncryptionPublicKeyRequest: 'get-encryption-public-key-request',
  decryptRequest: 'decryptRequest',
  dappConnectRequest: 'dapp-connect-request',
  watchAsset: 'watch-asset',
  addChain: 'add-chain',
  switchAccount: 'switch-account',
  authEmailAccount: 'auth-email-account',
  authEmailLogin: 'auth-email-login',
  authEmailRegister: 'auth-email-register',
  networksConfiguration: 'networks-configuration',
  settingsTerms: 'settings/terms',
  settingsAbout: 'settings/about',
  networksSettings: 'settings/networks',
  accountsSettings: 'settings/accounts',
  devicePasswordSet: 'settings/device-password-set',
  devicePasswordChange: 'settings/device-password-change',
  devicePasswordRecovery: 'settings/device-password-recovery',
  addressBook: 'settings/address-book',
  manageTokens: 'settings/manage-tokens',
  recoveryPhrasesSettings: 'settings/recovery-phrases',
  safeImport: 'safe-import',
  optOuts: 'settings/opt-outs'
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
  COMMON_ROUTES.safeImport
] as const

export { MOBILE_ROUTES, ONBOARDING_WEB_ROUTES, ROUTES, WEB_ROUTES }
