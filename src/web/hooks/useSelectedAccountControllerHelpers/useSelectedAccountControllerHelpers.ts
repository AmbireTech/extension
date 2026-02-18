import { useEffect } from 'react'

import { setExtraContext } from '@common/config/analytics/CrashAnalytics'
import useControllerState from '@common/hooks/useControllerState'

export default function useSelectedAccountControllerHelpers() {
  const { state } = useControllerState({ id: 'SelectedAccountController' })

  useEffect(() => {
    if (!state.account?.addr) return

    setExtraContext('address', state.account.addr)
  }, [state.account?.addr])
}
