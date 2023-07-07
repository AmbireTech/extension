import React from 'react'
import { Outlet, Route, Routes } from 'react-router-dom'

import { EmailLoginProvider } from '@common/modules/auth/contexts/emailLoginContext'
import { JsonLoginProvider } from '@common/modules/auth/contexts/jsonLoginContext'
import AuthScreen from '@common/modules/auth/screens/AuthScreen'
import CollectibleScreen from '@common/modules/dashboard/screens/CollectibleScreen'
import DashboardScreen from '@common/modules/dashboard/screens/DashboardScreen'
import EarnScreen from '@common/modules/earn/screens/EarnScreen'
import GasInformationScreen from '@common/modules/gas-tank/screens/GasInformationScreen'
import GasTankScreen from '@common/modules/gas-tank/screens/GasTankScreen'
import {
  headerAlpha as defaultHeaderAlpha,
  headerBeta as defaultHeaderBeta,
  headerGamma as defaultHeaderGamma
} from '@common/modules/header/config/headerConfig'
import NoConnectionScreen from '@common/modules/no-connection/screens/NoConnectionScreen'
import { PendingTransactionsProvider } from '@common/modules/pending-transactions/contexts/pendingTransactionsContext'
import PendingTransactionsScreen from '@common/modules/pending-transactions/screens/PendingTransactionsScreen'
import ProviderScreen from '@common/modules/receive/screens/ProviderScreen'
import ReceiveScreen from '@common/modules/receive/screens/ReceiveScreen'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import SendScreen from '@common/modules/send/screens/SendScreen'
import SignersScreen from '@common/modules/settings/screens/SignersScreen'
import SignMessageScreen from '@common/modules/sign-message/screens/SignMessageScreen'
import TransactionsScreen from '@common/modules/transactions/screens/TransactionsScreen'
import colors from '@common/styles/colors'
import AuthLayoutWrapper from '@web/components/AuthLayoutWrapper'
import AccountsImporterScreen from '@web/modules/accounts-importer/screens/AccountsImporterScreen'
import GetEncryptionPublicKeyRequestScreen from '@web/modules/approval-requests/screens/GetEncryptionPublicKeyRequestScreen'
import PermissionRequestScreen from '@web/modules/approval-requests/screens/PermissionRequestScreen'
import SwitchNetworkRequestScreen from '@web/modules/approval-requests/screens/SwitchNetworkRequestScreen'
import WatchTokenRequestScreen from '@web/modules/approval-requests/screens/WatchTokenRequestScreen'
import AddAccountPasswordToVaultScreen from '@web/modules/auth/screens/AddAccountPasswordToVaultScreen'
import EmailAccountScreen from '@web/modules/auth/screens/EmailAccountScreen'
import EmailLoginScreen from '@web/modules/auth/screens/EmailLoginScreen'
import EmailRegisterScreen from '@web/modules/auth/screens/EmailRegisterScreen'
import ExternalSignerLoginScreen from '@web/modules/auth/screens/ExternalSignerLoginScreen'
import GetStartedScreen from '@web/modules/auth/screens/GetStartedScreen'
import JsonLoginScreen from '@web/modules/auth/screens/JsonLoginScreen'
import ConnectLedgerScreen from '@web/modules/hardware-wallet/screens/ConnectLedgerScreen'
import HardwareWalletSelectorScreen from '@web/modules/hardware-wallet/screens/HardwareWalletSelectorScreen'
import RequestLedgerPermissionScreen from '@web/modules/hardware-wallet/screens/RequestLedgerPermissionScreen'
import OnBoardingScreen from '@web/modules/onboarding/screens/OnBoardingScreen'
import BottomNav from '@web/modules/router/components/BottomNav'
import NavMenu from '@web/modules/router/components/NavMenu'
import PrivateRoute from '@web/modules/router/components/PrivateRoute'
import TabOnlyRoute from '@web/modules/router/components/TabOnlyRoute'
import CreateNewVaultScreen from '@web/modules/vault/screens/CreateNewVaultScreen'
import { getUiType } from '@web/utils/uiType'

const navigationEnabled = !getUiType().isNotification
const headerAlpha = (
  <>
    {navigationEnabled
      ? defaultHeaderAlpha({ backgroundColor: colors.martinique })
      : defaultHeaderBeta({})}
    <Outlet />
  </>
)

const headerBeta = (
  <>
    {defaultHeaderBeta({})}
    <Outlet />
  </>
)

const headerGamma = (
  <>
    {navigationEnabled
      ? defaultHeaderGamma({ backgroundColor: colors.martinique })
      : defaultHeaderBeta({})}
    <Outlet />
  </>
)

const emailLoginProvider = (
  <EmailLoginProvider>
    <Outlet />
  </EmailLoginProvider>
)

const jsonLoginProvider = (
  <JsonLoginProvider>
    <Outlet />
  </JsonLoginProvider>
)

const footer = (
  <>
    <Outlet />
    <BottomNav />
  </>
)

const pendingTransactions = (
  <PendingTransactionsProvider>
    <Outlet />
  </PendingTransactionsProvider>
)

const MainRoutes = () => {
  return (
    <Routes>
      <Route element={AuthLayoutWrapper}>
        <Route path={WEB_ROUTES.noConnection} element={<NoConnectionScreen />} />
        <Route element={<TabOnlyRoute />}>
          <Route path={WEB_ROUTES.getStarted} element={<GetStartedScreen />} />
          <Route path={WEB_ROUTES.createVault} element={<CreateNewVaultScreen />} />
          <Route path={WEB_ROUTES.auth} element={<AuthScreen />} />

          <Route path={WEB_ROUTES.authEmailAccount} element={<EmailAccountScreen />} />
          <Route element={emailLoginProvider}>
            {/* TODO: Temporarily wire-up */}
            {/* <Route path={WEB_ROUTES.ambireAccountLogin} element={<EmailLoginScreen />} /> */}
            <Route path={WEB_ROUTES.authEmailLogin} element={<EmailLoginScreen />} />
            <Route path={WEB_ROUTES.authEmailRegister} element={<EmailRegisterScreen />} />
            <Route
              path={WEB_ROUTES.ambireAccountLoginPasswordConfirm}
              element={<AddAccountPasswordToVaultScreen />}
            />
          </Route>

          <Route element={jsonLoginProvider}>
            <Route path={WEB_ROUTES.ambireAccountJsonLogin} element={<JsonLoginScreen />} />
            <Route
              path={WEB_ROUTES.ambireAccountJsonLoginPasswordConfirm}
              element={<AddAccountPasswordToVaultScreen />}
            />
          </Route>

          <Route
            path={WEB_ROUTES.hardwareWalletSelect}
            element={<HardwareWalletSelectorScreen />}
          />
          <Route path={WEB_ROUTES.hardwareWalletLedger} element={<ConnectLedgerScreen />} />
          <Route
            path={WEB_ROUTES.hardwareWalletLedgerPermission}
            element={<RequestLedgerPermissionScreen />}
          />
          <Route path={WEB_ROUTES.externalSigner} element={<ExternalSignerLoginScreen />} />
          <Route path={WEB_ROUTES.accountsImporter} element={<AccountsImporterScreen />} />
          <Route path={WEB_ROUTES.onboarding} element={<OnBoardingScreen />} />
        </Route>
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={headerAlpha}>
          <Route element={footer}>
            <Route path={WEB_ROUTES.dashboard} element={<DashboardScreen />} />
            <Route path={WEB_ROUTES.collectible} element={<CollectibleScreen />} />
            <Route path={WEB_ROUTES.earn} element={<EarnScreen />} />
            <Route path={WEB_ROUTES.send} element={<SendScreen />} />
            <Route path={WEB_ROUTES.transactions} element={<TransactionsScreen />} />
            <Route path={WEB_ROUTES.gasTank} element={<GasTankScreen />} />
          </Route>
        </Route>
        <Route element={headerBeta}>
          <Route path={WEB_ROUTES.menu} element={<NavMenu />} />
          <Route element={pendingTransactions}>
            <Route path={WEB_ROUTES.pendingTransactions} element={<PendingTransactionsScreen />} />
          </Route>
          <Route path={WEB_ROUTES.receive} element={<ReceiveScreen />} />
          <Route path={WEB_ROUTES.provider} element={<ProviderScreen />} />
          <Route path={WEB_ROUTES.signMessage} element={<SignMessageScreen />} />
          <Route path={WEB_ROUTES.gasInformation} element={<GasInformationScreen />} />
          <Route
            path={WEB_ROUTES.getEncryptionPublicKeyRequest}
            element={<GetEncryptionPublicKeyRequestScreen />}
          />
          <Route path={WEB_ROUTES.permissionRequest} element={<PermissionRequestScreen />} />
          <Route path={WEB_ROUTES.switchNetwork} element={<SwitchNetworkRequestScreen />} />
          <Route path={WEB_ROUTES.watchAsset} element={<WatchTokenRequestScreen />} />
        </Route>
        <Route element={headerGamma}>
          <Route path={WEB_ROUTES.signers} element={<SignersScreen />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default MainRoutes
