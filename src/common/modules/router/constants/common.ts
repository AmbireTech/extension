const COMMON_ROUTES = {
  keyStoreUnlock: 'keystore-unlock',
  resetVault: 'reset-vault',
  getStarted: 'get-started',
  createVault: 'create-vault',
  auth: 'auth',
  ambireAccountLogin: 'ambire-account-email-login',
  ambireAccountLoginPasswordConfirm: 'ambire-account-login-password-confirm',
  ambireAccountJsonLogin: 'ambire-account-json-login',
  ambireAccountJsonLoginPasswordConfirm: 'ambire-account-json-login-password-confirm',
  externalSigner: 'external-signer',
  accountAdder: 'account-adder',
  dashboard: 'dashboard',
  collectible: 'collectible',
  earn: 'earn',
  transfer: 'transfer',
  transactions: 'transactions',
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
  accounts: 'accounts'
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
  dappsCatalog: 'dapps-catalog',
  web3Browser: 'web3-browser',
  enableOtp2FA: 'enable-otp-2fa',
  disableOtp2FA: 'disable-otp-2fa'
}

const WEB_ROUTES = {
  ...COMMON_ROUTES,
  createEmailVault: 'create-email-vault',
  terms: 'terms',
  keyStoreSetup: 'keystore-setup',
  getEncryptionPublicKeyRequest: 'get-encryption-public-key-request',
  onboarding: 'onboarding',
  permissionRequest: 'permission-request',
  watchAsset: 'watch-asset',
  hardwareWalletSelect: 'hardware-wallet/select',
  hardwareWalletLedger: 'hardware-wallet/ledger',
  authEmailAccount: 'auth-email-account',
  authEmailLogin: 'auth-email-login',
  authEmailRegister: 'auth-email-register',
  accountPersonalize: 'account-personalize',
  collection: 'collection'
}

const ROUTES = {
  ...COMMON_ROUTES,
  ...MOBILE_ROUTES,
  ...WEB_ROUTES
}

export { ROUTES, MOBILE_ROUTES, WEB_ROUTES }
