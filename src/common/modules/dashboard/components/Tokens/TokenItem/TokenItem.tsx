import React, { useCallback } from 'react'

import useController from '@common/hooks/useController'

import BaseTokenItem from './BaseTokenItem'
import RewardsTokenItem from './RewardsTokenItem'

import type { TokenResult } from '@ambire-common/libs/portfolio'

const TokenItem = ({ token }: { token: TokenResult }) => {
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { rewardsType } = token.flags

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

  const claimRewards = useCallback(() => sendTransaction('claimWalletRequest'), [sendTransaction])
  const mintVesting = useCallback(() => sendTransaction('mintVestingRequest'), [sendTransaction])

  if (rewardsType === 'wallet-rewards')
    return <RewardsTokenItem token={token} onPress={claimRewards} actionButtonText="Claim" />
  if (rewardsType === 'wallet-vesting')
    return <RewardsTokenItem token={token} actionButtonText="Claim" onPress={mintVesting} />

  return <BaseTokenItem token={token} />
}

export default React.memo(TokenItem)
