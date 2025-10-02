import React, { useCallback, useMemo } from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { PortfolioProjectedRewardsResult } from '@ambire-common/libs/portfolio/interfaces'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import BaseTokenItem from './BaseTokenItem'

const INFO_BTN_URL = 'https://help.ambire.com/hc/en-us/articles/22678327778460 '

const ProjectedRewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { portfolio } = useSelectedAccountControllerState()

  const {
    latest: { projectedRewards }
  } = portfolio

  const projectedRewardsResults = useMemo(
    () =>
      projectedRewards && projectedRewards.result
        ? (projectedRewards.result as PortfolioProjectedRewardsResult)
        : null,
    [projectedRewards]
  )

  const apy = useMemo(
    () =>
      projectedRewardsResults && projectedRewardsResults.apy ? projectedRewardsResults.apy : 0,
    [projectedRewardsResults]
  )

  const handleDetailsPress = useCallback(() => {
    window.open(INFO_BTN_URL, '_blank')
  }, [])

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Pressable
          onPress={handleDetailsPress}
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
            {t('Info')}
          </Text>
        </Pressable>
      }
      gradientStyle={
        themeType === THEME_TYPES.DARK
          ? 'linear-gradient(81deg, #2B2D36 0%, #2A1D6F 100%)'
          : 'linear-gradient(81deg, #D6DBF3 0%, #6000FF 100%)'
      }
      label={
        <Text
          fontSize={12}
          color={themeType === THEME_TYPES.DARK ? '#CADBEB' : '#32333E'}
          weight="regular"
        >
          {t('Projected APY: ')}
          <Text fontSize={12} color="#00FFC8">
            {`${Number(apy).toFixed(2)}%`}
          </Text>
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(ProjectedRewardsTokenItem)
