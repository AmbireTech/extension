import React from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import BaseTokenItem from './BaseTokenItem'
import ProjectedRewardsTokenItem from './ProjectedRewardsTokenItem'
import RewardsTokenItem from './RewardsTokenItem'
import VestingTokenItem from './VestingTokenItem'

const TokenItem = ({ token }: { token: TokenResult }) => {
  const { portfolio } = useSelectedAccountControllerState()
  console.log('portfolio:', portfolio)
  const { networks } = useNetworksControllerState()
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]

  console.log('token:', token)
  // TODO: add isProjectedRewards flag when available from the backend
  const { isVesting, isRewards, isProjectedRewards } = getAndFormatTokenDetails(
    token,
    networks,
    simulatedAccountOp
  )
  // const isRewards = true // TODO: replace with real flag once available

  // if ((isRewards || isVesting) && !balance) return null
  console.log('isProjectedRewards:', isProjectedRewards)
  if (isProjectedRewards) return <ProjectedRewardsTokenItem token={token} /> // TODO: replace with real flag once available
  if (isRewards) return <RewardsTokenItem token={token} />
  if (isVesting) return <VestingTokenItem token={token} />

  return <BaseTokenItem token={token} />
}

export default React.memo(TokenItem)
