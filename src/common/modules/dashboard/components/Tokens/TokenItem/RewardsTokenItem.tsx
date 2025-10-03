import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'

import BaseTokenItem from './BaseTokenItem'

const GRADIENT_STYLE = 'linear-gradient(90deg, #B082FF 0%, #5F02FF 100%)'

const RewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  const sendClaimTransaction = useCallback(() => {
    dispatch({
      type: 'REQUESTS_CONTROLLER_BUILD_REQUEST',
      params: { type: 'claimWalletRequest', params: { token } }
    })
  }, [dispatch, token])

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Pressable
          onPress={sendClaimTransaction}
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
          {t('Claimable rewards')}
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(RewardsTokenItem)
