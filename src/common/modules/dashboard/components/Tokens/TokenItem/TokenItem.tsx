import React, { useCallback } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import useController from '@common/hooks/useController'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { getUiType } from '@common/utils/uiType'

import BaseTokenItem from './BaseTokenItem'
import RewardsTokenItem from './RewardsTokenItem'

const { isPopup } = getUiType()

const TokenItem = ({ token }: { token: TokenResult }) => {
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { state: portfolio } = useController(
    'SelectedAccountController',
    (state) => state.portfolio
  )
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]
  const { isVesting, isRewards } = getAndFormatTokenDetails(token, networks, simulatedAccountOp)

  const sendTransaction = useCallback(
    (type: 'claimWalletRequest' | 'mintVestingRequest') => {
      requestsDispatch({
        type: 'method',
        params: {
          method: 'build',
          args: [{ type, params: { token } }]
        }
      })
    },
    [requestsDispatch, token]
  )

  if (isRewards)
    return (
      <RewardsTokenItem
        token={token}
        onPress={() => sendTransaction('claimWalletRequest')}
        actionButtonText="Claim"
        description="Claimable rewards"
      />
    )
  if (isVesting)
    return (
      <RewardsTokenItem
        token={token}
        actionButtonText="Claim"
        onPress={() => sendTransaction('mintVestingRequest')}
        description={!isPopup ? 'Claimable early supporters vestings' : 'Claimable vestings'}
      />
    )

  return <BaseTokenItem token={token} />
}

export default React.memo(TokenItem)
