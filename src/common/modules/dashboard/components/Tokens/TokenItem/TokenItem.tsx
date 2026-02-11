import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import BaseTokenItem from './BaseTokenItem'
import RewardsTokenItem from './RewardsTokenItem'

const { isPopup } = getUiType()

const TokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { portfolio } = useSelectedAccountControllerState()

  const { networks } = useNetworksControllerState()
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]
  const { isVesting, isRewards } = getAndFormatTokenDetails(token, networks, simulatedAccountOp)

  const sendTransaction = useCallback(
    (type: 'claimWalletRequest' | 'mintVestingRequest') => {
      dispatch({
        type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
        params: { type, params: { token } }
      })
    },
    [dispatch, token]
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
