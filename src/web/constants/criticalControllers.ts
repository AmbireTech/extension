import { ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type CriticalController = keyof AllControllersMappingType

// Controllers whose state must be present in the controllerStore before a given
// initial route can render and the splash can hide. Every other controller is
// initialized after first paint instead of blocking it. Routes not listed here
// fall back to full readiness (all controllers).

export const KEYSTORE_UNLOCK_CRITICAL_CONTROLLERS: CriticalController[] = [
  'KeystoreController',
  'WalletStateController',
  'EmailVaultController',
  'AccountsController',
  'SelectedAccountController'
]

export const DASHBOARD_CRITICAL_CONTROLLERS: CriticalController[] = [
  'SelectedAccountController',
  'AccountsController',
  'NetworksController',
  'WalletStateController'
]

export const ROUTE_CRITICAL_CONTROLLERS: Record<string, CriticalController[]> = {
  [ROUTES.keyStoreUnlock]: KEYSTORE_UNLOCK_CRITICAL_CONTROLLERS,
  [ROUTES.dashboard]: DASHBOARD_CRITICAL_CONTROLLERS,
  [ROUTES.walletStaking]: ['SelectedAccountController', 'WalletStateController'],
  [ROUTES.walletMigration]: ['SelectedAccountController', 'WalletStateController']
}

/**
 * Everything a newly opened view might need before it can paint, whichever of the routes above it
 * turns out to open on. The background pushes these to a connecting view without waiting to learn
 * where it is headed, which is only one or two states more than the exact route would need.
 */
export const CRITICAL_CONTROLLERS: CriticalController[] = [
  ...new Set(Object.values(ROUTE_CRITICAL_CONTROLLERS).flat())
]
