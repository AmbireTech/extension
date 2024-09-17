import React from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import { StepperProvider } from '@common/modules/auth/contexts/stepperContext'
import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { SignAccountOpControllerStateProvider } from '@web/contexts/signAccountOpControllerStateContext'
import { TransferControllerStateProvider } from '@web/contexts/transferControllerStateContext'
import AccountAdderScreen from '@web/modules/account-adder/screens/AccountAdderScreen'
import AccountPersonalizeScreen from '@web/modules/account-personalize/screens/AccountPersonalizeScreen'
import AccountSelectScreen from '@web/modules/account-select/screens/AccountSelectScreen'
import AddChainScreen from '@web/modules/action-requests/screens/AddChainScreen'
import BenzinScreen from '@web/modules/action-requests/screens/BenzinScreen'
import DappConnectScreen from '@web/modules/action-requests/screens/DappConnectScreen'
import GetEncryptionPublicKeyRequestScreen from '@web/modules/action-requests/screens/GetEncryptionPublicKeyRequestScreen'
import WatchTokenRequestScreen from '@web/modules/action-requests/screens/WatchTokenRequestScreen'
import CreateSeedPhraseConfirmScreen from '@web/modules/auth/modules/create-seed-phrase/screens/CreateSeedPhraseConfirmScreen'
import CreateSeedPhrasePrepareScreen from '@web/modules/auth/modules/create-seed-phrase/screens/CreateSeedPhrasePrepareScreen'
import CreateSeedPhraseWriteScreen from '@web/modules/auth/modules/create-seed-phrase/screens/CreateSeedPhraseWriteScreen'
import EmailAccountScreen from '@web/modules/auth/screens/EmailAccountScreen'
import EmailLoginScreen from '@web/modules/auth/screens/EmailLoginScreen'
import EmailRegisterScreen from '@web/modules/auth/screens/EmailRegisterScreen'
import GetStartedScreen from '@web/modules/auth/screens/GetStartedScreen'
import HotWalletCreateSelectorScreen from '@web/modules/auth/screens/HotWalletCreateSelectorScreen'
import HotWalletImportSelectorScreen from '@web/modules/auth/screens/HotWalletImportSelectorScreen'
import PrivateKeyImportScreen from '@web/modules/auth/screens/PrivateKeyImportScreen'
import SeedPhraseImportScreen from '@web/modules/auth/screens/SeedPhraseImportScreen'
import DappCatalogScreen from '@web/modules/dapp-catalog/screens/DappCatalogScreen'
import HardwareWalletReconnectScreen from '@web/modules/hardware-wallet/screens/HardwareWalletReconnectScreen'
import HardwareWalletSelectorScreen from '@web/modules/hardware-wallet/screens/HardwareWalletSelectorScreen'
import KeyStoreResetScreen from '@web/modules/keystore/screens/KeyStoreResetScreen/KeyStoreResetScreen'
import KeyStoreSetupScreen from '@web/modules/keystore/screens/KeyStoreSetupScreen'
import NetworksScreen from '@web/modules/networks/screens'
import InviteVerifiedRoute from '@web/modules/router/components/InviteVerifiedRoute'
import NavMenu from '@web/modules/router/components/NavMenu'
import PrivateRoute from '@web/modules/router/components/PrivateRoute'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import { SettingsRoutesProvider } from '@web/modules/settings/contexts/SettingsRoutesContext'
import AccountsSettingsScreen from '@web/modules/settings/screens/AccountsSettingsScreen'
import AddressBookSettingsScreen from '@web/modules/settings/screens/AddressBookSettingsScreen'
import CustomTokensSettingsScreen from '@web/modules/settings/screens/CustomTokensSettingsScreen'
import DevicePasswordChangeSettingsScreen from '@web/modules/settings/screens/DevicePasswordChangeSettingsScreen'
import DevicePasswordRecoverySettingsScreen from '@web/modules/settings/screens/DevicePasswordRecoverySettingsScreen'
import DevicePasswordSetSettingsScreen from '@web/modules/settings/screens/DevicePasswordSetSettingsScreen'
import GeneralSettingsScreen from '@web/modules/settings/screens/GeneralSettingsScreen'
import KeystoreScreen from '@web/modules/settings/screens/KeystoreScreen'
import NetworksSettingsScreen from '@web/modules/settings/screens/NetworksSettingsScreen/NetworksSettingsScreen'
import SignedMessageHistorySettingsScreen from '@web/modules/settings/screens/SignedMessageHistorySettingsScreen'
import TermsSettingsScreen from '@web/modules/settings/screens/TermsSettingsScreen'
import TransactionHistorySettingsScreen from '@web/modules/settings/screens/TransactionHistorySettingsScreen'
import SignAccountOpScreen from '@web/modules/sign-account-op/screens/SignAccountOpScreen'
import SignMessageScreen from '@web/modules/sign-message/screens/SignMessageScreen'
import SwapAndBridgeScreen from '@web/modules/swap-and-bridge/screens/SwapAndBridgeScreen'
import Terms from '@web/modules/terms/screens/Terms'
import TransferScreen from '@web/modules/transfer/screens/TransferScreen'
import ViewOnlyAccountAdderScreen from '@web/modules/view-only-account-adder/ViewOnlyAccountAdderScreen'

const stepperProvider = (
  <StepperProvider>
    <Outlet />
  </StepperProvider>
)

const MainRoutes = () => {
  return (
    <Routes>
      <Route element={<InviteVerifiedRoute />}>
        <Route element={stepperProvider}>
          <Route path={WEB_ROUTES.noConnection} element={<NoConnectionScreen />} />
          <Route element={<TabOnlyRoute />}>
            <Route path={WEB_ROUTES.getStarted} element={<GetStartedScreen />} />
            <Route path={WEB_ROUTES.terms} element={<Terms />} />
            <Route path={WEB_ROUTES.keyStoreSetup} element={<KeyStoreSetupScreen />} />

            <Route path={WEB_ROUTES.authEmailAccount} element={<EmailAccountScreen />} />
            <Route path={WEB_ROUTES.authEmailLogin} element={<EmailLoginScreen />} />
            <Route path={WEB_ROUTES.authEmailRegister} element={<EmailRegisterScreen />} />
            <Route path={WEB_ROUTES.importHotWallet} element={<HotWalletImportSelectorScreen />} />
            <Route
              path={WEB_ROUTES.hardwareWalletSelect}
              element={<HardwareWalletSelectorScreen />}
            />
            <Route
              path={WEB_ROUTES.hardwareWalletReconnect}
              element={<HardwareWalletReconnectScreen />}
            />

            <Route
              path={WEB_ROUTES.viewOnlyAccountAdder}
              element={<ViewOnlyAccountAdderScreen />}
            />

            <Route path={WEB_ROUTES.importPrivateKey} element={<PrivateKeyImportScreen />} />
            <Route path={WEB_ROUTES.importSeedPhrase} element={<SeedPhraseImportScreen />} />

            <Route path={WEB_ROUTES.createHotWallet} element={<HotWalletCreateSelectorScreen />} />

            <Route
              path={WEB_ROUTES.createSeedPhrasePrepare}
              element={<CreateSeedPhrasePrepareScreen />}
            />
            <Route
              path={WEB_ROUTES.createSeedPhraseWrite}
              element={<CreateSeedPhraseWriteScreen />}
            />
            <Route
              path={WEB_ROUTES.createSeedPhraseConfirm}
              element={<CreateSeedPhraseConfirmScreen />}
            />

            <Route path={WEB_ROUTES.accountAdder} element={<AccountAdderScreen />} />
            <Route path={WEB_ROUTES.accountPersonalize} element={<AccountPersonalizeScreen />} />

            <Route path={WEB_ROUTES.keyStoreReset} element={<KeyStoreResetScreen />} />
            <Route element={<PrivateRoute />}>
              <Route
                path={WEB_ROUTES.transfer}
                element={
                  <TransferControllerStateProvider>
                    <TransferScreen />
                  </TransferControllerStateProvider>
                }
              />
              <Route path={WEB_ROUTES.swapAndBridge} element={<SwapAndBridgeScreen />} />
              <Route element={<SettingsRoutesProvider />}>
                <Route path={WEB_ROUTES.generalSettings} element={<GeneralSettingsScreen />} />
                <Route path={WEB_ROUTES.accountsSettings} element={<AccountsSettingsScreen />} />
                <Route path={WEB_ROUTES.networksSettings} element={<NetworksSettingsScreen />} />
                <Route
                  path={WEB_ROUTES.transactions}
                  element={<TransactionHistorySettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.signedMessages}
                  element={<SignedMessageHistorySettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordSet}
                  element={<DevicePasswordSetSettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordChange}
                  element={<DevicePasswordChangeSettingsScreen />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordRecovery}
                  element={<DevicePasswordRecoverySettingsScreen />}
                />
                <Route path={WEB_ROUTES.customTokens} element={<CustomTokensSettingsScreen />} />
                <Route path={WEB_ROUTES.addressBook} element={<AddressBookSettingsScreen />} />
                <Route path={WEB_ROUTES.settingsTerms} element={<TermsSettingsScreen />} />
                <Route path={WEB_ROUTES.keystore} element={<KeystoreScreen />} />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<PrivateRoute />}>
          <Route
            path={WEB_ROUTES.signAccountOp}
            element={
              <SignAccountOpControllerStateProvider>
                <SignAccountOpScreen />
              </SignAccountOpControllerStateProvider>
            }
          />
          <Route path={WEB_ROUTES.signMessage} element={<SignMessageScreen />} />
          <Route path={WEB_ROUTES.benzin} element={<BenzinScreen />} />

          <Route path={WEB_ROUTES.dappConnectRequest} element={<DappConnectScreen />} />
          <Route path={WEB_ROUTES.addChain} element={<AddChainScreen />} />
          <Route path={WEB_ROUTES.watchAsset} element={<WatchTokenRequestScreen />} />

          <Route
            path={WEB_ROUTES.getEncryptionPublicKeyRequest}
            element={<GetEncryptionPublicKeyRequestScreen />}
          />

          <Route path={WEB_ROUTES.menu} element={<NavMenu />} />
          <Route path={WEB_ROUTES.accountSelect} element={<AccountSelectScreen />} />
          <Route path={WEB_ROUTES.dappCatalog} element={<DappCatalogScreen />} />
          <Route path={WEB_ROUTES.networks} element={<NetworksScreen />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default MainRoutes
