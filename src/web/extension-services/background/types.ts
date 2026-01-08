import AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import { AccountsController } from '@ambire-common/controllers/accounts/accounts'
import { ActivityController } from '@ambire-common/controllers/activity/activity'
import { AddressBookController } from '@ambire-common/controllers/addressBook/addressBook'
import { AutoLoginController } from '@ambire-common/controllers/autoLogin/autoLogin'
import { BannerController } from '@ambire-common/controllers/banner/banner'
import { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import { DappsController } from '@ambire-common/controllers/dapps/dapps'
import { DefiPositionsController } from '@ambire-common/controllers/defiPositions/defiPositions'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { EmailVaultController } from '@ambire-common/controllers/emailVault/emailVault'
import { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'
import { InviteController } from '@ambire-common/controllers/invite/invite'
import { KeystoreController } from '@ambire-common/controllers/keystore/keystore'
import { MainController } from '@ambire-common/controllers/main/main'
import { NetworksController } from '@ambire-common/controllers/networks/networks'
import { PhishingController } from '@ambire-common/controllers/phishing/phishing'
import { PortfolioController } from '@ambire-common/controllers/portfolio/portfolio'
import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { RequestsController } from '@ambire-common/controllers/requests/requests'
import { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'
import { SignAccountOpController } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { SignMessageController } from '@ambire-common/controllers/signMessage/signMessage'
import { StorageController } from '@ambire-common/controllers/storage/storage'
import { SwapAndBridgeController } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { TransferController } from '@ambire-common/controllers/transfer/transfer'
import { UiController } from '@ambire-common/controllers/ui/ui'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'

export const controllersNestedInMainMapping = {
  StorageController,
  ProvidersController,
  NetworksController,
  AccountsController,
  SelectedAccountController,
  AccountPickerController,
  KeystoreController,
  SignMessageController,
  PortfolioController,
  ActivityController,
  EmailVaultController,
  SignAccountOpController,
  TransferController,
  PhishingController,
  DappsController,
  RequestsController,
  AddressBookController,
  DomainsController,
  ContractNamesController,
  InviteController,
  SwapAndBridgeController,
  FeatureFlagsController,
  DefiPositionsController,
  BannerController,
  UiController,
  AutoLoginController

  // Add the rest of the controllers that are part of the main controller:
  // - key is the name of the controller
  // - value is the type of the controller
}
export const controllersMapping = {
  MainController,
  WalletStateController,
  AutoLockController,
  ExtensionUpdateController,
  ...controllersNestedInMainMapping
}

export type ControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<typeof controllersMapping[K]>
}
