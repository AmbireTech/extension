import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { ProjectedRewardsTokenResult } from '@ambire-common/libs/portfolio/interfaces'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import BaseTokenItem from './BaseTokenItem'
import RewardsTokenItem from './RewardsTokenItem'

const { isPopup } = getUiType()

const INFO_BTN_URL = 'https://rewards.ambire.com/#/wallet'

const TokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { portfolio } = useSelectedAccountControllerState()

  const { networks } = useNetworksControllerState()
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]
  const { isVesting, isRewards, isProjectedRewards } = getAndFormatTokenDetails(
    token,
    networks,
    simulatedAccountOp
  )

  const handleDetailsPress = useCallback(() => {
    window.open(INFO_BTN_URL, '_blank')
  }, [])

  const projectedRewardsUserXp = useMemo(() => {
    if (isProjectedRewards) {
      const projectedRewardsToken = token as ProjectedRewardsTokenResult
      return Number(projectedRewardsToken.userXp || 0).toLocaleString('en-US', {
        maximumFractionDigits: 0
      })
    }
    return 0
  }, [isProjectedRewards, token])

  const projectedRewardsDescription = useMemo(
    () => (
      <Text fontSize={12} weight="regular">
        {t('Projected rewards ')}
        <Badge text={`${projectedRewardsUserXp} XP`} type="projectedRewards" weight="semiBold" />
      </Text>
    ),
    [projectedRewardsUserXp, t]
  )

  const sendTransaction = useCallback(
    (type: 'claimWalletRequest' | 'mintVestingRequest') => {
      dispatch({
        type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
        params: { type, params: { token } }
      })
    },
    [dispatch, token]
  )

  if (isProjectedRewards)
    return (
      <RewardsTokenItem
        onPress={handleDetailsPress}
        token={token}
        description={projectedRewardsDescription}
      />
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
