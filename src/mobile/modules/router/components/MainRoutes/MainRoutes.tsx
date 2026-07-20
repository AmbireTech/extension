import React from 'react'
import { Route, Routes } from 'react-router-native'

import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import AccountPersonalizeScreen from '@mobile/modules/account-personalize/screens/AccountPersonalizeScreen'
import AccountPickerScreen from '@mobile/modules/account-picker/screens/AccountPickerScreen'
import AccountSelectScreen from '@mobile/modules/account-select/screens/AccountSelectScreen'
import CreateSeedPhrasePrepareScreen from '@mobile/modules/auth/screens/CreateSeedPhrasePrepareScreen'
import CreateSeedPhraseWriteScreen from '@mobile/modules/auth/screens/CreateSeedPhraseWriteScreen'
import GetStartedScreen from '@mobile/modules/auth/screens/GetStartedScreen'
import ImportExistingAccountSelectorScreen from '@mobile/modules/auth/screens/ImportExistingAccountSelectorScreen'
import ImportSmartAccountJsonScreen from '@mobile/modules/auth/screens/ImportSmartAccountJson'
import MigrationOnboardingScreen from '@mobile/modules/auth/screens/MigrationOnboardingScreen'
import PrivateKeyImportScreen from '@mobile/modules/auth/screens/PrivateKeyImportScreen'
import SafeImportScreen from '@mobile/modules/auth/screens/SafeImportScreen'
import SeedPhraseImportScreen from '@mobile/modules/auth/screens/SeedPhraseImportScreen'
import ViewOnlyAccountAdderScreen from '@mobile/modules/auth/screens/ViewOnlyAccountAdderScreen'
import ExploreScreen from '@mobile/modules/explore/screens/ExploreScreen'
import ExploreSectionScreen from '@mobile/modules/explore/screens/ExploreSectionScreen'
import LedgerConnectScreen from '@mobile/modules/hardware-wallet/screens/LedgerConnectScreen'
import QrConnectScreen from '@mobile/modules/hardware-wallet/screens/QrConnectScreen'
import TrezorConnectScreen from '@mobile/modules/hardware-wallet/screens/TrezorConnectScreen'
import KeyStoreSetupScreen from '@mobile/modules/keystore/screens/KeyStoreSetupScreen'
import NetworksConfiguration from '@mobile/modules/network-settings/screens'
import PrivacyOptOutsConfiguration from '@mobile/modules/network-settings/screens/PrivacyOptOutsConfiguration'
import NetworksScreen from '@mobile/modules/networks/screens'
import QrReaderScreen from '@mobile/modules/qr-reader/screens/QrReaderScreen'
import ReceiveScreen from '@mobile/modules/receive/screens/ReceiveScreen'
import NavMenu from '@mobile/modules/router/components/NavMenu'
import AboutSettingsScreen from '@mobile/modules/settings/screens/AboutSettingsScreen'
import AccountsSettingsScreen from '@mobile/modules/settings/screens/AccountsSettingsScreen'
import GeneralSettingsScreen from '@mobile/modules/settings/screens/GeneralSettingsScreen'
import NetworksSettingsScreen from '@mobile/modules/settings/screens/NetworksSettingsScreen'
import TermsSettingsScreen from '@mobile/modules/settings/screens/TermsSettingsScreen'
import SwapAndBridgeScreen from '@mobile/modules/swap-and-bridge/screens/SwapAndBridgeScreen'
import TokenDetailsScreen from '@mobile/modules/token-details/screens/TokenDetailsScreen'
import TransferScreen from '@mobile/modules/transfer/screens/TransferScreen'
import DappWebViewScreen from '@mobile/modules/webview/screens/DappWebViewScreen'

const MainRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.keyStoreSetup} element={<KeyStoreSetupScreen />} />
      <Route element={<KeystoreUnlockedRoute />}>
        <Route path={ROUTES.getStarted} element={<GetStartedScreen />} />
        <Route path={ROUTES.migrationOnboarding} element={<MigrationOnboardingScreen />} />
        <Route path={ROUTES.networksConfiguration} element={<NetworksConfiguration />} />
        <Route
          path={ROUTES.privacyOptOutsConfiguration}
          element={<PrivacyOptOutsConfiguration />}
        />
        <Route path={ROUTES.viewOnlyAccountAdder} element={<ViewOnlyAccountAdderScreen />} />
        <Route
          path={ROUTES.importExistingAccount}
          element={<ImportExistingAccountSelectorScreen />}
        />
        <Route path={ROUTES.ledgerConnect} element={<LedgerConnectScreen />} />
        <Route path={ROUTES.trezorConnect} element={<TrezorConnectScreen />} />
        <Route path={ROUTES.qrConnect} element={<QrConnectScreen />} />

        <Route path={ROUTES.importPrivateKey} element={<PrivateKeyImportScreen />} />
        <Route path={ROUTES.importSeedPhrase} element={<SeedPhraseImportScreen />} />
        <Route path={ROUTES.importSmartAccountJson} element={<ImportSmartAccountJsonScreen />} />
        <Route path={ROUTES.safeImport} element={<SafeImportScreen />} />

        <Route path={ROUTES.createSeedPhrasePrepare} element={<CreateSeedPhrasePrepareScreen />} />
        <Route path={ROUTES.createSeedPhraseWrite} element={<CreateSeedPhraseWriteScreen />} />

        <Route path={ROUTES.accountPicker} element={<AccountPickerScreen />} />
        <Route path={ROUTES.accountPersonalize} element={<AccountPersonalizeScreen />} />

        <Route element={<AuthenticatedRoute />}>
          <Route path={ROUTES.receive} element={<ReceiveScreen />} />
          <Route path={ROUTES.transfer} element={<TransferScreen />} />
          <Route path={ROUTES.topUpGasTank} element={<TransferScreen isTopUpScreen />} />
          <Route path={ROUTES.accountSelect} element={<AccountSelectScreen />} />
          <Route path={ROUTES.tokenDetails} element={<TokenDetailsScreen />} />
          <Route path={ROUTES.networks} element={<NetworksScreen />} />
          <Route path={ROUTES.swapAndBridge} element={<SwapAndBridgeScreen />} />
          <Route path={ROUTES.menu} element={<NavMenu />} />
          <Route path={ROUTES.generalSettings} element={<GeneralSettingsScreen />} />
          <Route path={ROUTES.accountsSettings} element={<AccountsSettingsScreen />} />
          <Route path={ROUTES.networksSettings} element={<NetworksSettingsScreen />} />
          <Route path={ROUTES.settingsAbout} element={<AboutSettingsScreen />} />
          <Route path={ROUTES.settingsTerms} element={<TermsSettingsScreen />} />
          <Route path={ROUTES.explore} element={<ExploreScreen />} />
          <Route path={ROUTES.exploreSection} element={<ExploreSectionScreen />} />
          <Route path={ROUTES.dappWebView} element={<DappWebViewScreen />} />
          <Route path={ROUTES.qrReader} element={<QrReaderScreen />} />
        </Route>
      </Route>
      {/* Fallback route to suppress "No routes matched location" warnings when multiple Routes blocks are rendered */}
      <Route path="*" element={null} />
    </Routes>
  )
}

export default MainRoutes
