import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'

import BaseTokenItem from './BaseTokenItem'

const RewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { themeType, theme } = useTheme()
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
            { width: 70, height: 38 },
            {
              borderWidth: 1,
              borderColor: 'transparent',
              backgroundColor: hovered
                ? themeType === THEME_TYPES.DARK
                  ? '#888C9F50'
                  : '#F4F4F760'
                : themeType === THEME_TYPES.DARK
                ? '#888C9F40'
                : '#F4F4F750'
            }
          ]}
        >
          <Text fontSize={14} weight="medium" color={theme.primary}>
            {t('Claim')}
          </Text>
        </Pressable>
      }
      gradientStyle={
        themeType === THEME_TYPES.DARK
          ? 'linear-gradient(81deg, #2B2D36 0%, #2A1D6F 100%)'
          : 'linear-gradient(81deg, #D6DBF3 0%, #6000FF 100%)'
      }
      label={t('Claimable rewards')}
      borderRadius={16}
    />
  )
}

export default React.memo(RewardsTokenItem)
