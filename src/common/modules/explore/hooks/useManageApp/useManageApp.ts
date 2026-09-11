import { useCallback } from 'react'

import { ConnectionSource, Dapp } from '@ambire-common/interfaces/dapp'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'

const useManageApp = (dapp: Dapp) => {
  const { dispatch } = useControllersMiddleware()
  const { state: account } = useController('SelectedAccountController', 'account')
  const { state: networks } = useController('NetworksController', 'networks')
  const { state: accounts } = useController('AccountsController', 'accounts')

  const onDisconnect = useCallback(
    (source?: ConnectionSource) => {
      dispatch({
        type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP',
        params: { id: dapp.id, url: dapp.url, source }
      })
    },
    [dispatch, dapp.id, dapp.url]
  )

  const onSelectNetwork = useCallback(
    (chainId: bigint) => {
      dispatch({
        type: 'CHANGE_CURRENT_DAPP_NETWORK',
        params: {
          id: dapp.id,
          chainId: Number(chainId)
        }
      })
    },
    [dispatch, dapp.id]
  )

  return {
    account,
    accounts,
    networks,
    onDisconnect,
    onSelectNetwork
  }
}

export default useManageApp
