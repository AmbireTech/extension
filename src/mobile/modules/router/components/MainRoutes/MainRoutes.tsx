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
import PrivateKeyImportScreen from '@mobile/modules/auth/screens/PrivateKeyImportScreen'
import SeedPhraseImportScreen from '@mobile/modules/auth/screens/SeedPhraseImportScreen'
import ViewOnlyAccountAdderScreen from '@mobile/modules/auth/screens/ViewOnlyAccountAdderScreen'
import LedgerConnectScreen from '@mobile/modules/hardware-wallet/screens/LedgerConnectScreen'
import KeyStoreSetupScreen from '@mobile/modules/keystore/screens/KeyStoreSetupScreen'
import TransferScreen from '@mobile/modules/transfer/screens/TransferScreen'

const MainRoutes = () => {
  return (
    <Routes>
      <Route path={ROUTES.keyStoreSetup} element={<KeyStoreSetupScreen />} />
      <Route element={<KeystoreUnlockedRoute />}>
        <Route path={ROUTES.getStarted} element={<GetStartedScreen />} />
        <Route path={ROUTES.viewOnlyAccountAdder} element={<ViewOnlyAccountAdderScreen />} />
        <Route
          path={ROUTES.importExistingAccount}
          element={<ImportExistingAccountSelectorScreen />}
        />
        <Route path={ROUTES.ledgerConnect} element={<LedgerConnectScreen />} />

        <Route path={ROUTES.importPrivateKey} element={<PrivateKeyImportScreen />} />
        <Route path={ROUTES.importSeedPhrase} element={<SeedPhraseImportScreen />} />
        <Route path={ROUTES.importSmartAccountJson} element={<ImportSmartAccountJsonScreen />} />

        <Route path={ROUTES.createSeedPhrasePrepare} element={<CreateSeedPhrasePrepareScreen />} />
        <Route path={ROUTES.createSeedPhraseWrite} element={<CreateSeedPhraseWriteScreen />} />

        <Route path={ROUTES.accountPicker} element={<AccountPickerScreen />} />
        <Route path={ROUTES.accountPersonalize} element={<AccountPersonalizeScreen />} />

        <Route element={<AuthenticatedRoute />}>
          <Route path={ROUTES.transfer} element={<TransferScreen />} />
          <Route path={ROUTES.topUpGasTank} element={<TransferScreen isTopUpScreen />} />
          <Route path={ROUTES.accountSelect} element={<AccountSelectScreen />} />
        </Route>
      </Route>
      {/* Fallback route to suppress "No routes matched location" warnings when multiple Routes blocks are rendered */}
      <Route path="*" element={null} />
    </Routes>
  )
}

export default MainRoutes
