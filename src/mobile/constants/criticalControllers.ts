import { AllControllersMappingType } from '@common/constants/controllersMapping'

// Controllers whose state must be present in the controllerStore before the
// mobile splash screen can hide and the initial route can render. Everything
// else is deferred until after the splash hides to avoid stringify+bridge+parse
// contention with the first paint of the unlock/dashboard screen.
export const MOBILE_CRITICAL_CONTROLLERS: (keyof AllControllersMappingType)[] = [
  'KeystoreController',
  'EmailVaultController',
  'AccountsController',
  'SelectedAccountController',
  'WalletStateController'
]
