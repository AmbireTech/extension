import React, { useCallback } from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import BaseTokenItem from './BaseTokenItem'

const INFO_BTN_URL = 'https://help.ambire.com/hc/en-us/articles/22678327778460 '
const GRADIENT_STYLE = 'linear-gradient(90deg, #B082FF 0%, #5F02FF 100%)'

const ProjectedRewardsTokenItem = ({ token }: { token: TokenResult }) => {
  const { t } = useTranslation()

  const handleDetailsPress = useCallback(() => {
    window.open(INFO_BTN_URL, '_blank')
  }, [])

  return (
    <BaseTokenItem
      token={token}
      extraActions={
        <Pressable
          testID="projected-rewards-info-button"
          onPress={handleDetailsPress}
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
            {t('Info')}
          </Text>
        </Pressable>
      }
      gradientStyle={GRADIENT_STYLE}
      label={
        <Text fontSize={12} weight="regular">
          {t('Projected rewards')}
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(ProjectedRewardsTokenItem)
