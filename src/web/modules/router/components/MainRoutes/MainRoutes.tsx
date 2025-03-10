import React, { useEffect } from 'react'
import { Outlet, Route, Routes, useLocation } from 'react-router-dom'

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
import SwitchAccountScreen from '@web/modules/action-requests/screens/SwitchAccountScreen'
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
import ImportSmartAccountJsonScreen from '@web/modules/auth/screens/ImportSmartAccountJson'
import PrivateKeyImportScreen from '@web/modules/auth/screens/PrivateKeyImportScreen'
import SaveImportedSeedScreen from '@web/modules/auth/screens/SaveImportedSeedScreen'
import SeedPhraseImportScreen from '@web/modules/auth/screens/SeedPhraseImportScreen'
import DappCatalogScreen from '@web/modules/dapp-catalog/screens/DappCatalogScreen'
import HardwareWalletReconnectScreen from '@web/modules/hardware-wallet/screens/HardwareWalletReconnectScreen'
import HardwareWalletSelectorScreen from '@web/modules/hardware-wallet/screens/HardwareWalletSelectorScreen'
import KeyStoreResetScreen from '@web/modules/keystore/screens/KeyStoreResetScreen/KeyStoreResetScreen'
import KeyStoreSetupScreen from '@web/modules/keystore/screens/KeyStoreSetupScreen'
import NetworksScreen from '@web/modules/networks/screens'
import AuthenticatedRoute from '@web/modules/router/components/AuthenticatedRoute'
import InviteVerifiedRoute from '@web/modules/router/components/InviteVerifiedRoute'
import KeystoreUnlockedRoute from '@web/modules/router/components/KeystoreUnlockedRoute'
import NavMenu from '@web/modules/router/components/NavMenu'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import { SettingsRoutesProvider } from '@web/modules/settings/contexts/SettingsRoutesContext'
import AboutSettingsScreen from '@web/modules/settings/screens/AboutSettingsScreen'
import AccountsSettingsScreen from '@web/modules/settings/screens/AccountsSettingsScreen'
import AddressBookSettingsScreen from '@web/modules/settings/screens/AddressBookSettingsScreen'
import BasicToSmartSettingsScreen from '@web/modules/settings/screens/BasicToSmartSettingsScreen'
import DevicePasswordChangeSettingsScreen from '@web/modules/settings/screens/DevicePasswordChangeSettingsScreen'
import DevicePasswordRecoverySettingsScreen from '@web/modules/settings/screens/DevicePasswordRecoverySettingsScreen'
import DevicePasswordSetSettingsScreen from '@web/modules/settings/screens/DevicePasswordSetSettingsScreen'
import ExportKeyScreen from '@web/modules/settings/screens/ExportKeyScreen'
import GeneralSettingsScreen from '@web/modules/settings/screens/GeneralSettingsScreen'
import ManageTokensSettingsScreen from '@web/modules/settings/screens/ManageTokensSettingsScreen'
import NetworksSettingsScreen from '@web/modules/settings/screens/NetworksSettingsScreen/NetworksSettingsScreen'
import SavedSeedScreen from '@web/modules/settings/screens/SavedSeedScreen'
import SecurityAndPrivacyScreen from '@web/modules/settings/screens/SecurityAndPrivacyScreen'
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
const routeTitles = {
  [WEB_ROUTES.noConnection]: 'No Connection',
  [WEB_ROUTES.keyStoreSetup]: 'Key Store Setup',
  [WEB_ROUTES.keyStoreReset]: 'Key Store Reset',
  [WEB_ROUTES.getStarted]: 'Get Started',
  [WEB_ROUTES.terms]: 'Terms',
  [WEB_ROUTES.authEmailAccount]: 'Email Account',
  [WEB_ROUTES.authEmailLogin]: 'Email Login',
  [WEB_ROUTES.authEmailRegister]: 'Email Register',
  [WEB_ROUTES.importHotWallet]: 'Import Hot Wallet',
  [WEB_ROUTES.hardwareWalletSelect]: 'Select Hardware Wallet',
  [WEB_ROUTES.hardwareWalletReconnect]: 'Reconnect Hardware Wallet',
  [WEB_ROUTES.viewOnlyAccountAdder]: 'Add View Only Account',
  [WEB_ROUTES.importPrivateKey]: 'Import Private Key',
  [WEB_ROUTES.importSeedPhrase]: 'Import Seed Phrase',
  [WEB_ROUTES.importSmartAccountJson]: 'Import Smart Account JSON',
  [WEB_ROUTES.createHotWallet]: 'Create Hot Wallet',
  [WEB_ROUTES.createSeedPhrasePrepare]: 'Prepare Seed Phrase',
  [WEB_ROUTES.createSeedPhraseWrite]: 'Write Seed Phrase',
  [WEB_ROUTES.createSeedPhraseConfirm]: 'Confirm Seed Phrase',
  [WEB_ROUTES.accountAdder]: 'Add Account',
  [WEB_ROUTES.accountPersonalize]: 'Personalize Account',
  [WEB_ROUTES.saveImportedSeed]: 'Save Imported Seed',
  [WEB_ROUTES.transfer]: 'Transfer',
  [WEB_ROUTES.topUpGasTank]: 'Top Up Gas Tank',
  [WEB_ROUTES.swapAndBridge]: 'Swap and Bridge',
  [WEB_ROUTES.generalSettings]: 'General Settings',
  [WEB_ROUTES.securityAndPrivacy]: 'Security and Privacy',
  [WEB_ROUTES.accountsSettings]: 'Accounts Settings',
  [WEB_ROUTES.basicToSmartSettingsScreen]: 'Basic to Smart Settings',
  [WEB_ROUTES.exportKey]: 'Export Key',
  [WEB_ROUTES.savedSeed]: 'Saved Seed',
  [WEB_ROUTES.networksSettings]: 'Networks Settings',
  [WEB_ROUTES.transactions]: 'Transaction History',
  [WEB_ROUTES.signedMessages]: 'Signed Messages History',
  [WEB_ROUTES.devicePasswordSet]: 'Set Device Password',
  [WEB_ROUTES.devicePasswordChange]: 'Change Device Password',
  [WEB_ROUTES.devicePasswordRecovery]: 'Recover Device Password',
  [WEB_ROUTES.manageTokens]: 'Manage Tokens',
  [WEB_ROUTES.addressBook]: 'Address Book',
  [WEB_ROUTES.settingsTerms]: 'Settings Terms',
  [WEB_ROUTES.settingsAbout]: 'About Settings',
  [WEB_ROUTES.signAccountOp]: 'Sign Account Operation',
  [WEB_ROUTES.signMessage]: 'Sign Message',
  [WEB_ROUTES.benzin]: 'Benzin',
  [WEB_ROUTES.switchAccount]: 'Switch Account',
  [WEB_ROUTES.dappConnectRequest]: 'Dapp Connect Request',
  [WEB_ROUTES.addChain]: 'Add Chain',
  [WEB_ROUTES.watchAsset]: 'Watch Asset',
  [WEB_ROUTES.getEncryptionPublicKeyRequest]: 'Get Encryption Public Key Request',
  [WEB_ROUTES.menu]: 'Menu',
  [WEB_ROUTES.accountSelect]: 'Select Account',
  [WEB_ROUTES.appCatalog]: 'Dapp Catalog',
  [WEB_ROUTES.networks]: 'Networks'
}

const MainRoutes = () => {
  const location = useLocation()

  useEffect(() => {
    const trimmedPathName = location.pathname.replace(/^\/|\/$/g, '')
    const title = `Ambire ${routeTitles[trimmedPathName]}` || 'Ambire Wallet'

    document.title = title
  }, [location.pathname])

  return (
    <Routes>
      <Route element={<InviteVerifiedRoute />}>
        <Route element={stepperProvider}>
          <Route path={WEB_ROUTES.noConnection} element={<NoConnectionScreen />} />

          <Route element={<TabOnlyRoute />}>
            <Route path={WEB_ROUTES.keyStoreSetup} element={<KeyStoreSetupScreen />} />
            <Route path={WEB_ROUTES.keyStoreReset} element={<KeyStoreResetScreen />} />

            <Route element={<KeystoreUnlockedRoute />}>
              <Route path={WEB_ROUTES.getStarted} element={<GetStartedScreen />} />
              <Route path={WEB_ROUTES.terms} element={<Terms />} />
              <Route path={WEB_ROUTES.authEmailAccount} element={<EmailAccountScreen />} />
              <Route path={WEB_ROUTES.authEmailLogin} element={<EmailLoginScreen />} />
              <Route path={WEB_ROUTES.authEmailRegister} element={<EmailRegisterScreen />} />
              <Route
                path={WEB_ROUTES.importHotWallet}
                element={<HotWalletImportSelectorScreen />}
              />
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
              <Route
                path={WEB_ROUTES.importSmartAccountJson}
                element={<ImportSmartAccountJsonScreen />}
              />

              <Route
                path={WEB_ROUTES.createHotWallet}
                element={<HotWalletCreateSelectorScreen />}
              />

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
              <Route path={WEB_ROUTES.saveImportedSeed} element={<SaveImportedSeedScreen />} />

              <Route element={<AuthenticatedRoute />}>
                <Route
                  path={WEB_ROUTES.transfer}
                  element={
                    <TransferControllerStateProvider>
                      <TransferScreen />
                    </TransferControllerStateProvider>
                  }
                />
                <Route
                  path={WEB_ROUTES.topUpGasTank}
                  element={
                    <TransferControllerStateProvider isTopUp>
                      <TransferScreen />
                    </TransferControllerStateProvider>
                  }
                />
                <Route path={WEB_ROUTES.swapAndBridge} element={<SwapAndBridgeScreen />} />
                <Route element={<SettingsRoutesProvider />}>
                  <Route path={WEB_ROUTES.generalSettings} element={<GeneralSettingsScreen />} />
                  <Route
                    path={WEB_ROUTES.securityAndPrivacy}
                    element={<SecurityAndPrivacyScreen />}
                  />
                  <Route path={WEB_ROUTES.accountsSettings} element={<AccountsSettingsScreen />} />
                  <Route
                    path={WEB_ROUTES.basicToSmartSettingsScreen}
                    element={<BasicToSmartSettingsScreen />}
                  />
                  <Route path={WEB_ROUTES.exportKey} element={<ExportKeyScreen />} />
                  <Route path={WEB_ROUTES.savedSeed} element={<SavedSeedScreen />} />
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
                  <Route path={WEB_ROUTES.manageTokens} element={<ManageTokensSettingsScreen />} />
                  <Route path={WEB_ROUTES.addressBook} element={<AddressBookSettingsScreen />} />
                  <Route path={WEB_ROUTES.settingsTerms} element={<TermsSettingsScreen />} />
                  <Route path={WEB_ROUTES.settingsAbout} element={<AboutSettingsScreen />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
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
            <Route path={WEB_ROUTES.switchAccount} element={<SwitchAccountScreen />} />

            <Route path={WEB_ROUTES.dappConnectRequest} element={<DappConnectScreen />} />
            <Route path={WEB_ROUTES.addChain} element={<AddChainScreen />} />
            <Route path={WEB_ROUTES.watchAsset} element={<WatchTokenRequestScreen />} />

            <Route
              path={WEB_ROUTES.getEncryptionPublicKeyRequest}
              element={<GetEncryptionPublicKeyRequestScreen />}
            />

            <Route path={WEB_ROUTES.menu} element={<NavMenu />} />
            <Route path={WEB_ROUTES.accountSelect} element={<AccountSelectScreen />} />
            <Route path={WEB_ROUTES.appCatalog} element={<DappCatalogScreen />} />
            <Route path={WEB_ROUTES.networks} element={<NetworksScreen />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default MainRoutes
