import { Platform } from 'react-native'

import i18n from '@common/config/localization/localization'
import { ROUTES } from '@common/modules/router/constants/common'

const routesConfig: {
  [key in keyof typeof ROUTES]: {
    route: keyof typeof ROUTES
    title: string
  }
} = {
  [ROUTES.keyStoreUnlock]: {
    route: ROUTES.keyStoreUnlock,
    title: Platform.select({
      default: i18n.t('Welcome Back')
    })
  },
  [ROUTES.resetVault]: {
    route: ROUTES.resetVault,
    title: Platform.select({
      web: i18n.t('Reset your\nAmbire Key Store Lock'),
      default: i18n.t('Reset Ambire Key Store')
    })
  },
  [ROUTES.noConnection]: {
    route: ROUTES.noConnection,
    title: Platform.select({
      default: i18n.t('No Connection')
    })
  },
  [ROUTES.addReferral]: {
    route: ROUTES.addReferral,
    // Next screen has title, this makes the transition smoother (no logo jump effect)
    title: ' '
  },
  [ROUTES.getStarted]: {
    route: ROUTES.getStarted,
    title: Platform.select({
      default: i18n.t('Welcome'),
      web: ''
    })
  },
  [ROUTES.terms]: {
    route: ROUTES.terms,
    title: ''
  },
  [ROUTES.onboardingOnFirstLogin]: {
    route: ROUTES.onboardingOnFirstLogin,
    title: ''
  },
  [ROUTES.authEmailAccount]: {
    route: ROUTES.authEmailAccount,
    title: ''
  },
  [ROUTES.authEmailLogin]: {
    route: ROUTES.authEmailLogin,
    title: ''
  },
  [ROUTES.authEmailRegister]: {
    route: ROUTES.authEmailRegister,
    title: ''
  },
  [ROUTES.keyStoreSetup]: {
    route: ROUTES.keyStoreSetup,
    title: i18n.t('Ambire Key Store'),
    flow: 'email',
    flowStep: 2
  },
  [ROUTES.createEmailVault]: {
    route: ROUTES.createEmailVault,
    flow: 'email',
    flowStep: 0
  },
  [ROUTES.auth]: {
    route: ROUTES.auth,
    title: Platform.select({
      web: i18n.t('Welcome to\nAmbire Wallet Extension'),
      default: i18n.t('Welcome to Ambire')
    })
  },
  [ROUTES.ambireAccountLogin]: {
    route: ROUTES.ambireAccountLogin,
    title: Platform.select({
      default: i18n.t('Login'),
      web: ''
    }),
    flow: 'email',
    flowStep: 1
  },
  [ROUTES.ambireAccountLoginPasswordConfirm]: {
    route: ROUTES.ambireAccountLoginPasswordConfirm,
    title: Platform.select({
      web: i18n.t('Confirm Account Password'),
      default: i18n.t('Login')
    })
  },
  [ROUTES.ambireAccountJsonLogin]: {
    route: ROUTES.ambireAccountJsonLogin,
    title: Platform.select({
      web: i18n.t('Import From JSON File'),
      default: i18n.t('Import From File')
    })
  },
  [ROUTES.ambireAccountJsonLoginPasswordConfirm]: {
    route: ROUTES.ambireAccountJsonLoginPasswordConfirm,
    title: Platform.select({
      web: i18n.t('Confirm Account Password'),
      default: i18n.t('Login')
    })
  },
  [ROUTES.hardwareWallet]: {
    route: ROUTES.hardwareWallet,
    title: Platform.select({
      default: i18n.t('Login with Hardware Wallet')
    })
  },
  [ROUTES.hardwareWalletSelect]: {
    route: ROUTES.hardwareWalletSelect,
    title: '',
    flow: 'hw',
    flowStep: 0
  },
  [ROUTES.hardwareWalletLedger]: {
    route: ROUTES.hardwareWalletLedger,
    title: Platform.select({
      default: i18n.t('Login with Hardware Wallet')
    })
  },
  [ROUTES.accountAdder]: {
    route: ROUTES.accountAdder,
    title: ''
  },
  [ROUTES.accountPersonalize]: {
    route: ROUTES.accountPersonalize,
    title: Platform.select({
      default: i18n.t('Personalize Your Accounts')
    })
  },
  [ROUTES.externalSigner]: {
    route: ROUTES.externalSigner,
    title: '',
    flow: 'legacy',
    flowStep: 0
  },
  [ROUTES.dashboard]: {
    route: ROUTES.dashboard,
    title: Platform.select({
      default: i18n.t('Dashboard')
    })
  },
  [ROUTES.collectible]: {
    route: ROUTES.collectible,
    title: Platform.select({
      default: i18n.t('Collectibles')
    })
  },
  [ROUTES.earn]: {
    route: ROUTES.earn,
    title: Platform.select({
      default: i18n.t('Earn')
    })
  },
  [ROUTES.sign]: {
    route: ROUTES.sign,
    title: Platform.select({
      default: i18n.t('Sign')
    })
  },
  [ROUTES.transfer]: {
    route: ROUTES.transfer,
    title: Platform.select({
      default: i18n.t('Send Crypto')
    })
  },
  [ROUTES.transactions]: {
    route: ROUTES.transactions,
    title: Platform.select({
      default: i18n.t('Transactions')
    })
  },
  [ROUTES.gasTank]: {
    route: ROUTES.gasTank,
    title: Platform.select({
      default: i18n.t('Gas Tank')
    })
  },
  [ROUTES.pendingTransactions]: {
    route: ROUTES.pendingTransactions,
    title: Platform.select({
      default: i18n.t('Pending Transactions')
    })
  },
  [ROUTES.receive]: {
    route: ROUTES.receive,
    title: Platform.select({
      default: i18n.t('Receive')
    })
  },
  [ROUTES.provider]: {
    route: ROUTES.provider,
    title: Platform.select({
      default: i18n.t('Provider')
    })
  },
  [ROUTES.signMessage]: {
    route: ROUTES.signMessage,
    title: Platform.select({
      default: i18n.t('Sign Message')
    })
  },
  [ROUTES.gasInformation]: {
    route: ROUTES.gasInformation,
    title: Platform.select({
      default: i18n.t('Gas Information')
    })
  },
  [ROUTES.signers]: {
    route: ROUTES.signers,
    title: Platform.select({
      default: i18n.t('Manage Signers')
    })
  },
  [ROUTES.permissionRequest]: {
    route: ROUTES.permissionRequest,
    title: Platform.select({
      web: i18n.t('Webpage Wants to Connect'),
      default: i18n.t('dApp Wants to Connect')
    })
  },
  [ROUTES.watchAsset]: {
    route: ROUTES.watchAsset,
    title: Platform.select({
      web: i18n.t('Webpage Wants to Add Token'),
      default: i18n.t('dApp Wants to Add Token')
    })
  },
  [ROUTES.menu]: {
    route: ROUTES.menu,
    title: Platform.select({
      web: i18n.t('Menu'),
      default: i18n.t('Side Menu')
    })
  },
  [ROUTES.manageVaultLock]: {
    route: ROUTES.manageVaultLock,
    title: Platform.select({
      default: i18n.t('Manage Key Store Lock')
    })
  },
  [ROUTES.getEncryptionPublicKeyRequest]: {
    route: ROUTES.getEncryptionPublicKeyRequest,
    title: Platform.select({
      default: i18n.t('Get Encryption Public Key Request')
    })
  },
  [ROUTES.dataDeletionPolicy]: {
    route: ROUTES.dataDeletionPolicy,
    title: Platform.select({
      default: i18n.t('Data Deletion Policy')
    })
  },
  [ROUTES.connect]: {
    route: ROUTES.connect,
    title: Platform.select({
      default: i18n.t('Connect a dApp')
    })
  },
  [ROUTES.swap]: {
    route: ROUTES.swap,
    title: Platform.select({
      default: i18n.t('Swap')
    })
  },
  [ROUTES.onboarding]: {
    route: ROUTES.onboarding,
    title: ''
  },
  [ROUTES.backup]: {
    route: ROUTES.backup,
    title: ''
  },
  [ROUTES.web3Browser]: {
    route: ROUTES.web3Browser,
    title: ''
  },
  [ROUTES.dappsCatalog]: {
    route: ROUTES.dappsCatalog,
    title: i18n.t('dApps')
  },
  [ROUTES.enableOtp2FA]: {
    route: ROUTES.enableOtp2FA,
    title: i18n.t('Enable 2FA')
  },
  [ROUTES.disableOtp2FA]: {
    route: ROUTES.disableOtp2FA,
    title: i18n.t('Disable 2FA')
  },
  [ROUTES.accountSelect]: {
    route: ROUTES.accountSelect,
    title: Platform.select({
      default: i18n.t('Accounts')
    })
  }
}

export default routesConfig
