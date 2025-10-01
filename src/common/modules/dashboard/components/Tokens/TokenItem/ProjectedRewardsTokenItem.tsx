import React from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import BaseTokenItem from './BaseTokenItem'

const ProjectedRewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { portfolio } = useSelectedAccountControllerState()

  const {
    latest: { projectedRewards }
  } = portfolio

  const apyFormatted = projectedRewards ? projectedRewards.result?.apy.toFixed(2) : 0
  console.log('apyFormatted:', apyFormatted)

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Pressable
          onPress={() => console.log('Learn more about projected rewards')}
          style={({ hovered }: any) => [
            flexbox.center,
            flexbox.directionRow,
            common.borderRadiusPrimary,
            { width: 109, height: 38 },
            {
              borderWidth: 1,
              borderColor: 'transparent',
              backgroundColor: '#F4F4F780'
            }
          ]}
        >
          <Text fontSize={14} weight="medium" color={theme.primary}>
            {t('Learn more')}
          </Text>
        </Pressable>
      }
      gradientStyle={
        themeType === THEME_TYPES.DARK
          ? 'linear-gradient(81deg, #2B2D36 0%, #2A1D6F 100%)'
          : 'linear-gradient(81deg, #D6DBF3 0%, #6000FF 100%)'
      }
      label={
        <Text fontSize={12} weight="regular">
          {t('Projected APY: ')}
          <Text fontSize={12} color="#00FFC8">
            {`${apyFormatted}%`}
          </Text>
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(ProjectedRewardsTokenItem)
