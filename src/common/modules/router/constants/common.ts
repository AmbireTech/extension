const COMMON_ROUTES = {
  keyStoreUnlock: 'keystore-unlock',
  resetVault: 'reset-vault',
  getStarted: 'get-started',
  createVault: 'create-vault',
  auth: 'auth',
  ambireAccountLogin: 'ambire-account-email-login',
  externalSigner: 'external-signer',
  accountAdder: 'account-adder',
  dashboard: 'dashboard',
  collectible: 'collectible',
  earn: 'earn',
  transfer: 'transfer',
  topUpGasTank: 'top-up-gas-tank',
  signAccountOp: 'sign-account-op',
  transactions: 'transactions',
  signedMessages: 'signed-messages',
  gasTank: 'gas-tank',
  pendingTransactions: 'pending-transactions',
  receive: 'receive',
  provider: 'provider',
  signMessage: 'sign-message',
  gasInformation: 'gas-information',
  signers: 'signers',
  menu: 'menu',
  swap: 'swap',
  noConnection: 'no-connection',
  backup: 'backup',
  accounts: 'accounts',
  dappCatalog: 'dapp-catalog'
}

const MOBILE_ROUTES = {
  ...COMMON_ROUTES,
  addReferral: 'add-referral',
  connect: 'connect',
  dataDeletionPolicy: 'data-deletion-policy',
  manageVaultLock: 'manage-vault-lock',
  onboardingOnFirstLogin: 'onboarding-on-first-login',
  noConnection: 'no-connection',
  hardwareWallet: 'hardware-wallet',
  web3Browser: 'web3-browser',
  enableOtp2FA: 'enable-otp-2fa',
  disableOtp2FA: 'disable-otp-2fa'
}

const WEB_ROUTES = {
  ...COMMON_ROUTES,
  inviteVerify: 'invite-verify',
  terms: 'terms',
  keyStoreSetup: 'keystore-setup',
  keyStoreReset: 'keystore-reset',
  getEncryptionPublicKeyRequest: 'get-encryption-public-key-request',
  dappConnectRequest: 'dapp-connect-request',
  watchAsset: 'watch-asset',
  addChain: 'add-chain',
  switchAccount: 'switch-account',
  hardwareWalletSelect: 'hardware-wallet/select',
  hardwareWalletReconnect: 'hardware-wallet/reconnect',
  hardwareWalletLedger: 'hardware-wallet/ledger',
  authEmailAccount: 'auth-email-account',
  authEmailLogin: 'auth-email-login',
  authEmailRegister: 'auth-email-register',
  accountPersonalize: 'account-personalize',
  accountSelect: 'account-select',
  viewOnlyAccountAdder: 'view-only-account-adder',
  networks: 'networks',
  generalSettings: 'settings/general',
  settingsTerms: 'settings/terms',
  networksSettings: 'settings/networks',
  accountsSettings: 'settings/accounts',
  smarterEOAsSettings: 'settings/basic-to-smart',
  exportKey: 'settings/accounts/exportKey',
  devicePasswordSet: 'settings/device-password-set',
  devicePasswordChange: 'settings/device-password-change',
  devicePasswordRecovery: 'settings/device-password-recovery',
  addressBook: 'settings/address-book',
  customTokens: 'settings/custom-tokens',
  importHotWallet: 'import-hot-wallet',
  importPrivateKey: 'import-private-key',
  importSmartAccountJson: 'import-smart-account-json',
  importSeedPhrase: 'import-seed-phrase',
  createHotWallet: 'create-hot-wallet',
  createSeedPhrasePrepare: 'create-seed-phrase/prepare',
  createSeedPhraseWrite: 'create-seed-phrase/write',
  createSeedPhraseConfirm: 'create-seed-phrase/confirm',
  benzin: 'benzin',
  swapAndBridge: 'swap-and-bridge',
  savedSeed: 'saved-seed',
  securityAndPrivacy: 'settings/security-and-privacy',
  saveImportedSeed: 'save-imported-seed'
}

const ROUTES = {
  ...COMMON_ROUTES,
  ...MOBILE_ROUTES,
  ...WEB_ROUTES
}

export { ROUTES, MOBILE_ROUTES, WEB_ROUTES }
