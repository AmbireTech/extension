const COMMON_ROUTES = {
  unlockVault: 'unlock-vault',
  resetVault: 'reset-vault',
  getStarted: 'get-started',
  createVault: 'create-vault',
  auth: 'auth',
  ambireAccountLogin: 'ambire-account-email-login',
  ambireAccountLoginPasswordConfirm: 'ambire-account-login-password-confirm',
  ambireAccountJsonLogin: 'ambire-account-json-login',
  ambireAccountJsonLoginPasswordConfirm: 'ambire-account-json-login-password-confirm',
  externalSigner: 'external-signer',
  accountsImporter: 'accounts-importer',
  dashboard: 'dashboard',
  collectible: 'collectible',
  earn: 'earn',
  send: 'send',
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
  backup: 'backup'
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
  getEncryptionPublicKeyRequest: 'get-encryption-public-key-request',
  onboarding: 'onboarding',
  permissionRequest: 'permission-request',
  switchNetwork: 'switch-network',
  watchAsset: 'watch-asset',
  hardwareWalletSelect: 'hardware-wallet/select',
  hardwareWalletLedger: 'hardware-wallet/ledger',
  hardwareWalletLedgerPermission: 'hardware-wallet/ledger-permission',
  authEmailAccount: 'auth-email-account',
  authEmailLogin: 'auth-email-login',
  authEmailRegister: 'auth-email-register'
}

const ROUTES = {
  ...COMMON_ROUTES,
  ...MOBILE_ROUTES,
  ...WEB_ROUTES
}

export { ROUTES, MOBILE_ROUTES, WEB_ROUTES }
