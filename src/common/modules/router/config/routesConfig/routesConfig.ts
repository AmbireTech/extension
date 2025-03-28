import { Platform } from 'react-native'

import i18n from '@common/config/localization/localization'
import { ROUTES } from '@common/modules/router/constants/common'

type RouteConfig = {
  [K in keyof typeof ROUTES]: {
    route: string
    title: string
    name: string
  }
}

const routesConfig: RouteConfig = {
  [ROUTES.keyStoreUnlock]: {
    route: ROUTES.keyStoreUnlock,
    title: Platform.select({
      default: i18n.t('Welcome Back')
    }),
    name: Platform.select({
      default: i18n.t('Welcome Back')
    })
  },
  [ROUTES.noConnection]: {
    route: ROUTES.noConnection,
    title: Platform.select({
      default: i18n.t('No Connection')
    }),
    name: Platform.select({
      default: i18n.t('No Connection')
    })
  },
  [ROUTES.getStarted]: {
    route: ROUTES.getStarted,
    title: Platform.select({
      default: i18n.t('Welcome to Ambire Wallet'),
      web: i18n.t('Welcome to Ambire Wallet')
    }),
    name: Platform.select({
      default: i18n.t('Welcome to Ambire Wallet'),
      web: i18n.t('Welcome to Ambire Wallet')
    })
  },
  [ROUTES.terms]: {
    route: ROUTES.terms,
    title: Platform.select({
      default: i18n.t('Terms of Service'),
      web: i18n.t('Terms of Service')
    }),
    name: Platform.select({
      default: i18n.t('Terms of Service'),
      web: i18n.t('Terms of Service')
    })
  },
  [ROUTES.authEmailAccount]: {
    route: ROUTES.authEmailAccount,
    title: Platform.select({
      default: i18n.t('Email Account'),
      web: i18n.t('Email Account')
    }),
    name: Platform.select({
      default: i18n.t('Email Account'),
      web: i18n.t('Email Account')
    })
  },
  [ROUTES.authEmailLogin]: {
    route: ROUTES.authEmailLogin,
    title: Platform.select({
      default: i18n.t('Email Login'),
      web: i18n.t('Email Login')
    }),
    name: Platform.select({
      default: i18n.t('Email Login'),
      web: i18n.t('Email Login')
    })
  },
  [ROUTES.authEmailRegister]: {
    route: ROUTES.authEmailRegister,
    title: Platform.select({
      default: i18n.t('Email Register'),
      web: i18n.t('Email Register')
    }),
    name: Platform.select({
      default: i18n.t('Email Register'),
      web: i18n.t('Email Register')
    })
  },
  [ROUTES.keyStoreSetup]: {
    route: ROUTES.keyStoreSetup,
    title: i18n.t('Ambire Key Store'),
    name: i18n.t('Key Store')
  },
  [ROUTES.keyStoreReset]: {
    route: ROUTES.keyStoreReset,
    title: i18n.t('Restore Key Store Passphrase'),
    name: i18n.t('Restore Key Store Passphrase')
  },
  [ROUTES.hardwareWalletSelect]: {
    route: ROUTES.hardwareWalletSelect,
    title: Platform.select({
      default: i18n.t('Select Hardware Wallet')
    }),
    name: Platform.select({
      default: i18n.t('Select Hardware Wallet')
    })
  },
  [ROUTES.hardwareWalletLedger]: {
    route: ROUTES.hardwareWalletLedger,
    title: Platform.select({
      default: i18n.t('Login with Hardware Wallet')
    }),
    name: Platform.select({
      default: i18n.t('Login with Hardware Wallet')
    })
  },
  [ROUTES.accountAdder]: {
    route: ROUTES.accountAdder,
    title: Platform.select({
      default: i18n.t('Add Account')
    }),
    name: Platform.select({
      default: i18n.t('Add Account')
    })
  },
  [ROUTES.accountPersonalize]: {
    route: ROUTES.accountPersonalize,
    title: Platform.select({
      default: i18n.t('Personalize Your Accounts')
    }),
    name: Platform.select({
      default: i18n.t('Personalize Your Accounts')
    })
  },
  [ROUTES.viewOnlyAccountAdder]: {
    route: ROUTES.viewOnlyAccountAdder,
    title: Platform.select({
      default: i18n.t('Add View-Only Account')
    }),
    name: Platform.select({
      default: i18n.t('Add View-Only Account')
    })
  },
  [ROUTES.dashboard]: {
    route: ROUTES.dashboard,
    title: Platform.select({
      default: i18n.t('Dashboard')
    }),
    name: Platform.select({ default: i18n.t('Dashboard') })
  },
  [ROUTES.signAccountOp]: {
    route: ROUTES.signAccountOp,
    title: Platform.select({
      default: i18n.t('Sign Account Operation')
    }),
    name: Platform.select({ default: i18n.t('Sign Account Operation') })
  },
  [ROUTES.transfer]: {
    route: ROUTES.transfer,
    title: Platform.select({
      default: i18n.t('Send Crypto')
    }),
    name: Platform.select({ default: i18n.t('Send Crypto') })
  },
  [ROUTES.transactions]: {
    route: ROUTES.transactions,
    title: Platform.select({
      default: i18n.t('Transaction History')
    }),
    name: Platform.select({ default: i18n.t('Transaction History') })
  },
  [ROUTES.signMessage]: {
    route: ROUTES.signMessage,
    title: Platform.select({
      default: i18n.t('Sign Message')
    }),
    name: Platform.select({ default: i18n.t('Sign Message') })
  },
  [ROUTES.dappConnectRequest]: {
    route: ROUTES.dappConnectRequest,
    title: Platform.select({
      web: i18n.t('Webpage Wants to Connect'),
      default: i18n.t('App Wants to Connect')
    }),
    name: Platform.select({
      web: i18n.t('Webpage Wants to Connect'),
      default: i18n.t('App Wants to Connect')
    })
  },
  [ROUTES.appCatalog]: {
    route: ROUTES.appCatalog,
    title: Platform.select({
      web: i18n.t('App Catalog'),
      default: i18n.t('App Catalog')
    }),
    name: Platform.select({
      web: i18n.t('App Catalog'),
      default: i18n.t('App Catalog')
    })
  },
  [ROUTES.watchAsset]: {
    route: ROUTES.watchAsset,
    title: Platform.select({
      web: i18n.t('Webpage Wants to Add Token'),
      default: i18n.t('App Wants to Add Token')
    }),
    name: Platform.select({
      web: i18n.t('Webpage Wants to Add Token'),
      default: i18n.t('App Wants to Add Token')
    })
  },
  [ROUTES.menu]: {
    route: ROUTES.menu,
    title: Platform.select({
      web: i18n.t('Menu'),
      default: i18n.t('Side Menu')
    }),
    name: Platform.select({
      web: i18n.t('Menu'),
      default: i18n.t('Side Menu')
    })
  },
  [ROUTES.getEncryptionPublicKeyRequest]: {
    route: ROUTES.getEncryptionPublicKeyRequest,
    title: Platform.select({
      default: i18n.t('Get Encryption Public Key Request')
    }),
    name: Platform.select({
      default: i18n.t('Get Encryption Public Key Request')
    })
  },
  [ROUTES.swap]: {
    route: ROUTES.swap,
    title: Platform.select({
      default: i18n.t('Swap')
    }),
    name: Platform.select({
      default: i18n.t('Swap')
    })
  },
  [ROUTES.appCatalog]: {
    route: ROUTES.appCatalog,
    title: i18n.t('App Catalog'),
    name: i18n.t('App Catalog')
  },
  [ROUTES.accountSelect]: {
    route: ROUTES.accountSelect,
    title: Platform.select({
      default: i18n.t('Accounts')
    }),
    name: Platform.select({
      default: i18n.t('Accounts')
    })
  },
  [ROUTES.inviteVerify]: {
    route: ROUTES.inviteVerify,
    title: Platform.select({
      default: i18n.t('Verify Email')
    }),
    name: Platform.select({ default: i18n.t('Verify Email') })
  },
  [ROUTES.importHotWallet]: {
    route: ROUTES.importHotWallet,
    title: Platform.select({
      default: i18n.t('Import Hot Wallet')
    }),
    name: Platform.select({ default: i18n.t('Import Hot Wallet') })
  },
  [ROUTES.hardwareWalletReconnect]: {
    route: ROUTES.hardwareWalletReconnect,
    title: Platform.select({
      default: i18n.t('Reconnect Hardware Wallet')
    }),
    name: Platform.select({ default: i18n.t('Reconnect Hardware Wallet') })
  },
  [ROUTES.importPrivateKey]: {
    route: ROUTES.importPrivateKey,
    title: Platform.select({
      default: i18n.t('Import Private Key')
    }),
    name: Platform.select({ default: i18n.t('Import Private Key') })
  },
  [ROUTES.importSeedPhrase]: {
    route: ROUTES.importSeedPhrase,
    title: Platform.select({
      default: i18n.t('Import Seed Phrase')
    }),
    name: Platform.select({ default: i18n.t('Import Seed Phrase') })
  },
  [ROUTES.importSmartAccountJson]: {
    route: ROUTES.importSmartAccountJson,
    title: Platform.select({
      default: i18n.t('Import Smart Account JSON')
    }),
    name: Platform.select({ default: i18n.t('Import Smart Account JSON') })
  },
  [ROUTES.createHotWallet]: {
    route: ROUTES.createHotWallet,
    title: Platform.select({
      default: i18n.t('Create Hot Wallet')
    }),
    name: Platform.select({ default: i18n.t('Create Hot Wallet') })
  },
  [ROUTES.createSeedPhrasePrepare]: {
    route: ROUTES.createSeedPhrasePrepare,
    title: Platform.select({
      default: i18n.t('Prepare Seed Phrase')
    }),
    name: Platform.select({ default: i18n.t('Prepare Seed Phrase') })
  },
  [ROUTES.createSeedPhraseWrite]: {
    route: ROUTES.createSeedPhraseWrite,
    title: Platform.select({
      default: i18n.t('Write Seed Phrase')
    }),
    name: Platform.select({ default: i18n.t('Write Seed Phrase') })
  },
  [ROUTES.createSeedPhraseConfirm]: {
    route: ROUTES.createSeedPhraseConfirm,
    title: Platform.select({
      default: i18n.t('Confirm Seed Phrase')
    }),
    name: Platform.select({ default: i18n.t('Confirm Seed Phrase') })
  },
  [ROUTES.saveImportedSeed]: {
    route: ROUTES.saveImportedSeed,
    title: Platform.select({
      default: i18n.t('Save Imported Seed')
    }),
    name: Platform.select({ default: i18n.t('Save Imported Seed') })
  },
  [ROUTES.topUpGasTank]: {
    route: ROUTES.topUpGasTank,
    title: Platform.select({
      default: i18n.t('Top Up Gas Tank')
    }),
    name: Platform.select({ default: i18n.t('Top Up Gas Tank') })
  },
  [ROUTES.swapAndBridge]: {
    route: ROUTES.swapAndBridge,
    title: Platform.select({
      default: i18n.t('Swap and Bridge')
    }),
    name: Platform.select({ default: i18n.t('Swap and Bridge') })
  },
  [ROUTES.generalSettings]: {
    route: ROUTES.generalSettings,
    title: Platform.select({
      default: i18n.t('General Settings')
    }),
    name: Platform.select({ default: i18n.t('General Settings') })
  },
  [ROUTES.securityAndPrivacy]: {
    route: ROUTES.securityAndPrivacy,
    title: Platform.select({
      default: i18n.t('Security and Privacy')
    }),
    name: Platform.select({ default: i18n.t('Security and Privacy') })
  },
  [ROUTES.accountsSettings]: {
    route: ROUTES.accountsSettings,
    title: Platform.select({
      default: i18n.t('Accounts Settings')
    }),
    name: Platform.select({ default: i18n.t('Accounts Settings') })
  },
  [ROUTES.basicToSmartSettingsScreen]: {
    route: ROUTES.basicToSmartSettingsScreen,
    title: Platform.select({
      default: i18n.t('Basic to Smart Settings')
    }),
    name: Platform.select({ default: i18n.t('Basic to Smart Settings') })
  },
  [ROUTES.exportKey]: {
    route: ROUTES.exportKey,
    title: Platform.select({ default: i18n.t('Export Key') }),
    name: Platform.select({ default: i18n.t('Export Key') })
  },
  [ROUTES.savedSeed]: {
    route: ROUTES.savedSeed,
    title: Platform.select({ default: i18n.t('Saved Seed') }),
    name: Platform.select({ default: i18n.t('Saved Seed') })
  },
  [ROUTES.networksSettings]: {
    route: ROUTES.networksSettings,
    title: Platform.select({ default: i18n.t('Networks') }),
    name: Platform.select({ default: i18n.t('Networks') })
  },
  [ROUTES.signedMessages]: {
    route: ROUTES.signedMessages,
    title: Platform.select({ default: i18n.t('Signed Messages History') }),
    name: Platform.select({ default: i18n.t('Signed Messages History') })
  },
  [ROUTES.devicePasswordSet]: {
    route: ROUTES.devicePasswordSet,
    title: Platform.select({ default: i18n.t('Set Device Password') }),
    name: Platform.select({ default: i18n.t('Set Device Password') })
  },
  [ROUTES.devicePasswordChange]: {
    route: ROUTES.devicePasswordChange,
    title: Platform.select({ default: i18n.t('Change Device Password') }),
    name: Platform.select({ default: i18n.t('Change Device Password') })
  },
  [ROUTES.devicePasswordRecovery]: {
    route: ROUTES.devicePasswordRecovery,
    title: Platform.select({ default: i18n.t('Recover Device Password') }),
    name: Platform.select({ default: i18n.t('Recover Device Password') })
  },
  [ROUTES.manageTokens]: {
    route: ROUTES.manageTokens,
    title: Platform.select({ default: i18n.t('Manage Tokens') }),
    name: Platform.select({ default: i18n.t('Manage Tokens') })
  },
  [ROUTES.addressBook]: {
    route: ROUTES.addressBook,
    title: Platform.select({ default: i18n.t('Address Book') }),
    name: Platform.select({ default: i18n.t('Address Book') })
  },
  [ROUTES.settingsTerms]: {
    route: ROUTES.settingsTerms,
    title: Platform.select({ default: i18n.t('Terms of Service') }),
    name: Platform.select({ default: i18n.t('Terms of Service') })
  },
  [ROUTES.settingsAbout]: {
    route: ROUTES.settingsAbout,
    title: Platform.select({ default: i18n.t('About') }),
    name: Platform.select({ default: i18n.t('About') })
  },
  [ROUTES.benzin]: {
    route: ROUTES.benzin,
    title: Platform.select({ default: i18n.t('Benzin') }),
    name: Platform.select({ default: i18n.t('Benzin') })
  },
  [ROUTES.switchAccount]: {
    route: ROUTES.switchAccount,
    title: Platform.select({ default: i18n.t('Switch Account') }),
    name: Platform.select({ default: i18n.t('Switch Account') })
  },
  [ROUTES.dappConnectRequest]: {
    route: ROUTES.dappConnectRequest,
    title: Platform.select({ default: i18n.t('Dapp Connect Request') }),
    name: Platform.select({ default: i18n.t('Dapp Connect Request') })
  },
  [ROUTES.addChain]: {
    route: ROUTES.addChain,
    title: Platform.select({ default: i18n.t('Add Chain') }),
    name: Platform.select({ default: i18n.t('Add Chain') })
  },
  [ROUTES.networks]: {
    route: ROUTES.networks,
    title: Platform.select({ default: i18n.t('Networks') }),
    name: Platform.select({ default: i18n.t('Networks') })
  }
}

export default routesConfig
