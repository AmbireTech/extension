import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { getUiType } from '@web/utils/uiType'

import BaseTokenItem from './BaseTokenItem'

const { isPopup } = getUiType()

const GRADIENT_STYLE = 'linear-gradient(90deg, #B082FF 0%, #5F02FF 100%)'

const VestingTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const sendVestingTransaction = useCallback(() => {
    dispatch({
      type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
      params: { type: 'mintVestingRequest', params: { token } }
    })
  }, [dispatch, token])
  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Pressable
          testID="projected-rewards-claim-button"
          onPress={sendVestingTransaction}
          style={({ hovered }: any) => [
            flexbox.center,
            flexbox.directionRow,
            common.borderRadiusPrimary,
            {
              width: 70,
              height: 38,
              background: GRADIENT_STYLE,
              opacity: hovered ? 0.8 : 1
            }
          ]}
        >
          <Text fontSize={14} weight="medium" color="white">
            {t('Claim')}
          </Text>
        </Pressable>
      }
      gradientStyle={GRADIENT_STYLE}
      label={
        <Text fontSize={12} weight="regular">
          {!isPopup ? t('Claimable early supporters vestings') : t('Claimable vestings')}
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(VestingTokenItem)
