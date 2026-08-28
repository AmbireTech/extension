import { useCallback } from 'react'

import { ConnectionSource, Dapp } from '@ambire-common/interfaces/dapp'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTrustDapp from '@common/hooks/useTrustDapp'

const useManageApp = (dapp: Dapp) => {
  const { dispatch } = useControllersMiddleware()
  const { trustDapp, untrustDapp } = useTrustDapp()
  const { account } = useController('SelectedAccountController').state
  const { networks } = useController('NetworksController').state
  const { accounts } = useController('AccountsController').state

  const onDisconnect = useCallback(
    (source?: ConnectionSource) => {
      dispatch({
        type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP',
        params: { id: dapp.id, url: dapp.url, source }
      })
    },
    [dispatch, dapp.id, dapp.url]
  )

  const onToggleTrust = useCallback(() => {
    if (dapp.isTrustedByUser) {
      untrustDapp(dapp.id)
      return
    }

    trustDapp(dapp.url)
  }, [trustDapp, untrustDapp, dapp.isTrustedByUser, dapp.id, dapp.url])

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
    onSelectNetwork,
    onToggleTrust
  }
}

export default useManageApp
