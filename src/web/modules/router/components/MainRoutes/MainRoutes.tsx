import React, { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useLocation } from 'react-router-dom'

import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import AuthenticatedRoute from '@common/modules/router/components/AuthenticatedRoute'
import KeystoreUnlockedRoute from '@common/modules/router/components/KeystoreUnlockedRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import Splash from '@web/components/Splash'
import NavMenu from '@web/modules/router/components/NavMenu'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import {
  AuthGroupScreen,
  PopupGroupScreen,
  SettingsGroupScreen
} from '@web/modules/router/route-bundles/groupScreens'
import { SettingsRoutesProvider } from '@web/modules/settings/contexts/SettingsRoutesContext'

const MainRoutes = () => {
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    const trimmedPathName = location.pathname.replace(/^\/|\/$/g, '')
    const routeConfig = routesConfig[trimmedPathName as keyof typeof routesConfig]
    const withTitlePrefix = routeConfig?.withTitlePrefix ?? true
    const title = `${withTitlePrefix ? 'Ambire ' : ''}${routeConfig?.name || t('Wallet')}`

    document.title = title
  }, [location.pathname, t])

  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path={WEB_ROUTES.noConnection} element={<NoConnectionScreen />} />

        <Route element={<TabOnlyRoute />}>
          <Route
            path={WEB_ROUTES.internalLogs}
            element={<SettingsGroupScreen pick={(m) => m.InternalLogsScreen} />}
          />
          <Route
            path={WEB_ROUTES.networksConfiguration}
            element={<SettingsGroupScreen pick={(m) => m.NetworksConfiguration} />}
          />
          <Route
            path={WEB_ROUTES.privacyOptOutsConfiguration}
            element={<SettingsGroupScreen pick={(m) => m.PrivacyOptOutsConfiguration} />}
          />
          <Route
            path={WEB_ROUTES.keyStoreSetup}
            element={<AuthGroupScreen pick={(m) => m.KeyStoreSetupScreen} />}
          />
          <Route
            path={WEB_ROUTES.keyStoreEmailRecovery}
            element={<AuthGroupScreen pick={(m) => m.KeyStoreEmailRecoveryScreen} />}
          />
          <Route
            path={WEB_ROUTES.keyStoreEmailRecoverySetNewPassword}
            element={<AuthGroupScreen pick={(m) => m.KeyStoreEmailRecoverySetNewPasswordScreen} />}
          />

          <Route element={<KeystoreUnlockedRoute />}>
            <Route
              path={WEB_ROUTES.getStarted}
              element={<AuthGroupScreen pick={(m) => m.GetStartedScreen} />}
            />
            <Route
              path={WEB_ROUTES.authEmailAccount}
              element={<AuthGroupScreen pick={(m) => m.EmailAccountScreen} />}
            />
            <Route
              path={WEB_ROUTES.authEmailLogin}
              element={<AuthGroupScreen pick={(m) => m.EmailLoginScreen} />}
            />
            <Route
              path={WEB_ROUTES.authEmailRegister}
              element={<AuthGroupScreen pick={(m) => m.EmailRegisterScreen} />}
            />
            <Route
              path={WEB_ROUTES.viewOnlyAccountAdder}
              element={<AuthGroupScreen pick={(m) => m.ViewOnlyAccountAdderScreen} />}
            />

            <Route
              path={WEB_ROUTES.importExistingAccount}
              element={<AuthGroupScreen pick={(m) => m.ImportExistingAccountSelectorScreen} />}
            />
            <Route
              path={WEB_ROUTES.ledgerConnect}
              element={<AuthGroupScreen pick={(m) => m.LedgerConnectScreen} />}
            />
            <Route
              path={WEB_ROUTES.safeImport}
              element={<AuthGroupScreen pick={(m) => m.SafeImportScreen} />}
            />
            <Route
              path={WEB_ROUTES.qrConnect}
              element={<AuthGroupScreen pick={(m) => m.QrConnectScreen} />}
            />
            <Route
              path={WEB_ROUTES.importPrivateKey}
              element={<AuthGroupScreen pick={(m) => m.PrivateKeyImportScreen} />}
            />
            <Route
              path={WEB_ROUTES.importSeedPhrase}
              element={<AuthGroupScreen pick={(m) => m.SeedPhraseImportScreen} />}
            />
            <Route
              path={WEB_ROUTES.importSmartAccountJson}
              element={<AuthGroupScreen pick={(m) => m.ImportSmartAccountJsonScreen} />}
            />

            <Route
              path={WEB_ROUTES.createSeedPhrasePrepare}
              element={<AuthGroupScreen pick={(m) => m.CreateSeedPhrasePrepareScreen} />}
            />
            <Route
              path={WEB_ROUTES.createSeedPhraseWrite}
              element={<AuthGroupScreen pick={(m) => m.CreateSeedPhraseWriteScreen} />}
            />

            <Route
              path={WEB_ROUTES.accountPicker}
              element={<AuthGroupScreen pick={(m) => m.AccountPickerScreen} />}
            />
            <Route
              path={WEB_ROUTES.accountPersonalize}
              element={<AuthGroupScreen pick={(m) => m.AccountPersonalizeScreen} />}
            />
            <Route
              path={WEB_ROUTES.onboardingCompleted}
              element={<AuthGroupScreen pick={(m) => m.OnboardingCompletedScreen} />}
            />
            <Route
              path={WEB_ROUTES.qrPermission}
              element={<AuthGroupScreen pick={(m) => m.QrCameraPermissionPage} />}
            />

            <Route element={<AuthenticatedRoute />}>
              <Route element={<SettingsRoutesProvider />}>
                <Route
                  path={WEB_ROUTES.generalSettings}
                  element={<SettingsGroupScreen pick={(m) => m.GeneralSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.accountsSettings}
                  element={<SettingsGroupScreen pick={(m) => m.AccountsSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.recoveryPhrasesSettings}
                  element={<SettingsGroupScreen pick={(m) => m.RecoveryPhrasesSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.networksSettings}
                  element={<SettingsGroupScreen pick={(m) => m.NetworksSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.transactions}
                  element={<SettingsGroupScreen pick={(m) => m.TransactionHistorySettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.signedMessages}
                  element={
                    <SettingsGroupScreen pick={(m) => m.SignedMessageHistorySettingsScreen} />
                  }
                />
                <Route
                  path={WEB_ROUTES.devicePasswordSet}
                  element={<SettingsGroupScreen pick={(m) => m.DevicePasswordSetSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.devicePasswordChange}
                  element={
                    <SettingsGroupScreen pick={(m) => m.DevicePasswordChangeSettingsScreen} />
                  }
                />
                <Route
                  path={WEB_ROUTES.devicePasswordRecovery}
                  element={
                    <SettingsGroupScreen pick={(m) => m.DevicePasswordRecoverySettingsScreen} />
                  }
                />
                <Route
                  path={WEB_ROUTES.optOuts}
                  element={<SettingsGroupScreen pick={(m) => m.OptOutsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.manageTokens}
                  element={<SettingsGroupScreen pick={(m) => m.ManageTokensSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.addressBook}
                  element={<SettingsGroupScreen pick={(m) => m.AddressBookSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.settingsTerms}
                  element={<SettingsGroupScreen pick={(m) => m.TermsSettingsScreen} />}
                />
                <Route
                  path={WEB_ROUTES.settingsAbout}
                  element={<SettingsGroupScreen pick={(m) => m.AboutSettingsScreen} />}
                />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route element={<KeystoreUnlockedRoute />}>
          <Route element={<AuthenticatedRoute />}>
            <Route
              path={WEB_ROUTES.transfer}
              element={<PopupGroupScreen pick={(m) => m.TransferScreen} />}
            />
            <Route
              path={WEB_ROUTES.topUpGasTank}
              element={<PopupGroupScreen pick={(m) => m.TransferScreen} isTopUpScreen />}
            />
            <Route
              path={WEB_ROUTES.signAccountOp}
              element={<PopupGroupScreen pick={(m) => m.SignAccountOpScreen} />}
            />
            <Route
              path={WEB_ROUTES.swapAndBridge}
              element={<PopupGroupScreen pick={(m) => m.SwapAndBridgeScreen} />}
            />
            <Route
              path={WEB_ROUTES.signMessage}
              element={<PopupGroupScreen pick={(m) => m.SignMessageScreen} />}
            />
            <Route
              path={WEB_ROUTES.benzin}
              element={<PopupGroupScreen pick={(m) => m.BenzinScreen} />}
            />
            <Route
              path={WEB_ROUTES.switchAccount}
              element={<PopupGroupScreen pick={(m) => m.SwitchAccountScreen} />}
            />

            <Route
              path={WEB_ROUTES.dappConnectRequest}
              element={<PopupGroupScreen pick={(m) => m.DappConnectScreen} />}
            />
            <Route
              path={WEB_ROUTES.addChain}
              element={<PopupGroupScreen pick={(m) => m.AddOrUpdateNetworkScreen} />}
            />
            <Route
              path={WEB_ROUTES.watchAsset}
              element={<PopupGroupScreen pick={(m) => m.WatchTokenRequestScreen} />}
            />

            <Route
              path={WEB_ROUTES.getEncryptionPublicKeyRequest}
              element={<PopupGroupScreen pick={(m) => m.GetEncryptionPublicKeyRequestScreen} />}
            />
            <Route
              path={WEB_ROUTES.decryptRequest}
              element={<PopupGroupScreen pick={(m) => m.DecryptRequestScreen} />}
            />

            <Route path={WEB_ROUTES.menu} element={<NavMenu />} />
            <Route
              path={WEB_ROUTES.tokenDetails}
              element={<PopupGroupScreen pick={(m) => m.TokenDetailsScreen} />}
            />
            <Route
              path={WEB_ROUTES.accountSelect}
              element={<PopupGroupScreen pick={(m) => m.AccountSelectScreen} />}
            />
            <Route
              path={WEB_ROUTES.receive}
              element={<PopupGroupScreen pick={(m) => m.ReceiveScreen} />}
            />
            <Route
              path={WEB_ROUTES.explore}
              element={<PopupGroupScreen pick={(m) => m.ExploreScreen} />}
            />
            <Route
              path={WEB_ROUTES.exploreSection}
              element={<PopupGroupScreen pick={(m) => m.ExploreSectionScreen} />}
            />
            <Route
              path={WEB_ROUTES.networks}
              element={<PopupGroupScreen pick={(m) => m.NetworksScreen} />}
            />
            <Route
              path={WEB_ROUTES.rewards}
              element={<PopupGroupScreen pick={(m) => m.ExtensionRewardsScreen} />}
            />
            <Route
              path={WEB_ROUTES.survey}
              element={<PopupGroupScreen pick={(m) => m.SurveyScreen} />}
            />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default MainRoutes
