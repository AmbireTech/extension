import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Controllers whose state must be present in the controllerStore before the
// mobile splash screen can hide and the initial route can render. Everything
// else is deferred until after the splash hides to avoid stringify+bridge+parse
// contention with the first paint of the unlock/dashboard screen.
export const MOBILE_CRITICAL_CONTROLLERS: (keyof AllControllersMappingType)[] = [
  'KeystoreController',
  'EmailVaultController',
  'AccountsController',
  'SelectedAccountController',
  'WalletStateController',
  // The invite gate redirect must be decided before the first paint, otherwise the user gets a
  // flash of the get-started screen before being sent to the invite screen.
  'InviteController',
  // GetStarted crashes without main. Consider removing it and unifying the critical controller
  // logic with web so it's route-driven. (useGetStarted causes the crash)
  'MainController'
]

// Controllers that only load once the splash has hidden, because the data they read
// (the phishing lists, the dapp catalog) is too large to sit on the boot path. They
// still have to report a ready state before `areAllControllerStatesLoaded` flips, but
// the wait for them is intentional, so it must not trip the store's
// "loading is taking too long" alarm.
export const MOBILE_DEFERRED_CONTROLLERS: (keyof AllControllersMappingType)[] = [
  'PhishingController',
  'DappsController'
]
