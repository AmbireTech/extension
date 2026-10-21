import { useEffect, useMemo } from 'react'

import { setCrashReportId, setTagContext } from '@common/config/analytics/CrashAnalytics'
import {
  createCrashReportAccountTagsSync,
  getCrashReportAccountTags
} from '@common/config/analytics/crashReportHelpers'
import useControllerState from '@common/hooks/useControllerState'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
const selectCrashReportId = (state: AllControllersMappingType['WalletStateController']) =>
  state.crashReportId
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

/**
 * Keeps the extension UI's crash reports in step with the crash report id and the traits of the
 * selected account, which the user can change while the page is open.
 */
export default function useCrashReportContext() {
  const { state: crashReportId } = useControllerState({
    id: 'WalletStateController',
    selector: selectCrashReportId
  })
  const { state: selectedAccount } = useControllerState({
    id: 'SelectedAccountController',
    selector: selectSelectedAccount
  })
  const { state: accounts } = useControllerState({
    id: 'AccountsController',
    selector: selectAccounts
  })
  const { state: accountStates } = useControllerState({
    id: 'AccountsController',
    selector: selectAccountStates
  })
  const { state: keys } = useControllerState({ id: 'KeystoreController', selector: selectKeys })

  const syncAccountTags = useMemo(() => createCrashReportAccountTagsSync(setTagContext), [])

  useEffect(() => {
    setCrashReportId(crashReportId)
  }, [crashReportId])

  useEffect(() => {
    // The provider mounts before the controllers' first state reaches the UI
    if (!accountStates || !keys || !accounts) return

    syncAccountTags(getCrashReportAccountTags({ selectedAccount, accountStates, keys, accounts }))
  }, [syncAccountTags, selectedAccount, accountStates, keys, accounts])
}
