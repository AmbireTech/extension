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

  const { networks } = useNetworksControllerState()
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]
  const { isVesting, isRewards, isProjectedRewards } = getAndFormatTokenDetails(
    token,
    networks,
    simulatedAccountOp
  )

  if (isProjectedRewards) return <ProjectedRewardsTokenItem token={token} />
  if (isRewards) return <RewardsTokenItem token={token} />
  if (isVesting) return <VestingTokenItem token={token} />

  return <BaseTokenItem token={token} />
}

export default React.memo(TokenItem)
