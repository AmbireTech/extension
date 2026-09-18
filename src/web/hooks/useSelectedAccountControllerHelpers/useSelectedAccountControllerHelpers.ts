import { useEffect } from 'react'

import { setExtraContext } from '@common/config/analytics/CrashAnalytics'
import useCacheDashboardBalance from '@common/hooks/useCacheDashboardBalance'
import useControllerState from '@common/hooks/useControllerState'

export default function useSelectedAccountControllerHelpers() {
  const { state } = useControllerState({ id: 'SelectedAccountController' })

  useCacheDashboardBalance()

  useEffect(() => {
    if (!state.account?.addr) return

    setExtraContext('address', state.account.addr)
  }, [state.account?.addr])
}
