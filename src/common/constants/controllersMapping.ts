import type AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import type { AccountsController } from '@ambire-common/controllers/accounts/accounts'
import type { ActivityController } from '@ambire-common/controllers/activity/activity'
import type { AddressBookController } from '@ambire-common/controllers/addressBook/addressBook'
import type { AutoLoginController } from '@ambire-common/controllers/autoLogin/autoLogin'
import type { BannerController } from '@ambire-common/controllers/banner/banner'
import type { ContractInfoController } from '@ambire-common/controllers/contractInfo/contractInfo'
import type { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import type { DappsController } from '@ambire-common/controllers/dapps/dapps'
import type { DebugController } from '@ambire-common/controllers/debug/debug'
import type { DomainsController } from '@ambire-common/controllers/domains/domains'
import type { EmailVaultController } from '@ambire-common/controllers/emailVault/emailVault'
import type { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'
import type { InviteController } from '@ambire-common/controllers/invite/invite'
import type { KeystoreController } from '@ambire-common/controllers/keystore/keystore'
import type { MainController } from '@ambire-common/controllers/main/main'
import type { NetworksController } from '@ambire-common/controllers/networks/networks'
import type { PhishingController } from '@ambire-common/controllers/phishing/phishing'
import type { PortfolioController } from '@ambire-common/controllers/portfolio/portfolio'
import type { ProvidersController } from '@ambire-common/controllers/providers/providers'
import type { RequestsController } from '@ambire-common/controllers/requests/requests'
import type { SafeController } from '@ambire-common/controllers/safe/safe'
import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'
import type { SignAccountOpController } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import type { SignMessageController } from '@ambire-common/controllers/signMessage/signMessage'
import type { StorageController } from '@ambire-common/controllers/storage/storage'
import type { SurveyController } from '@ambire-common/controllers/survey/survey'
import type { SwapAndBridgeController } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import type { TransferController } from '@ambire-common/controllers/transfer/transfer'
import type { UiController } from '@ambire-common/controllers/ui/ui'
import type { AutoLockController } from '@common/controllers/auto-lock'
import type { WalletStateController } from '@common/controllers/wallet-state'
import type { VerificationController } from '@ambire-common/controllers/verification/verification'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController'
import { createExhaustiveArray } from '@common/utils/createExhaustiveArray'

import type { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'

export type ControllersNestedInMainMappingType = {
  StorageController: StorageController
  ProvidersController: ProvidersController
  NetworksController: NetworksController
  AccountsController: AccountsController
  SelectedAccountController: SelectedAccountController
  AccountPickerController: AccountPickerController
  KeystoreController: KeystoreController
  SignMessageController: SignMessageController
  PortfolioController: PortfolioController
  ActivityController: ActivityController
  EmailVaultController: EmailVaultController
  SignAccountOpController: SignAccountOpController
  TransferController: TransferController
  PhishingController: PhishingController
  DappsController: DappsController
  RequestsController: RequestsController
  AddressBookController: AddressBookController
  DomainsController: DomainsController
  ContractNamesController: ContractNamesController
  InviteController: InviteController
  SwapAndBridgeController: SwapAndBridgeController
  FeatureFlagsController: FeatureFlagsController
  BannerController: BannerController
  UiController: UiController
  AutoLoginController: AutoLoginController
  SafeController: SafeController
  QrHardwareController: QrHardwareController
  ContractInfoController: ContractInfoController
  SurveyController: SurveyController
  DebugController: DebugController
  VerificationController: VerificationController

  // Add the rest of the controllers that are part of the main controller:
  // - key is the name of the controller
  // - value is the type of the controller
}

export const controllersNestedInMainMapping =
  createExhaustiveArray<ControllersNestedInMainMappingType>()([
    'StorageController',
    'ProvidersController',
    'NetworksController',
    'AccountsController',
    'SelectedAccountController',
    'AccountPickerController',
    'KeystoreController',
    'SignMessageController',
    'PortfolioController',
    'ActivityController',
    'EmailVaultController',
    'SignAccountOpController',
    'TransferController',
    'PhishingController',
    'DappsController',
    'RequestsController',
    'AddressBookController',
    'DomainsController',
    'ContractNamesController',
    'InviteController',
    'SwapAndBridgeController',
    'FeatureFlagsController',
    'BannerController',
    'UiController',
    'AutoLoginController',
    'SafeController',
    'QrHardwareController',
    'ContractInfoController',
    'SurveyController',
    'DebugController',
    'VerificationController'
  ] as const)

export type AllControllersMappingType = {
  MainController: MainController
  WalletStateController: WalletStateController
  AutoLockController: AutoLockController
  ExtensionUpdateController: ExtensionUpdateController
} & ControllersNestedInMainMappingType

export const allControllersMapping = createExhaustiveArray<AllControllersMappingType>()([
  'MainController',
  'WalletStateController',
  'AutoLockController',
  'ExtensionUpdateController',
  ...controllersNestedInMainMapping
] as const)
