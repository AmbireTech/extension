import React from 'react'
import { Pressable } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import BaseTokenItem from './BaseTokenItem'

const GRADIENT_STYLE = 'linear-gradient(90deg, #B082FF 0%, #5F02FF 100%)'

const RewardsTokenItem = ({
  token,
  onPress,
  actionButtonText,
  description
}: {
  token: TokenResult
  onPress?: () => void
  actionButtonText?: string
  description: string | React.ReactNode
}) => {
  const { t } = useTranslation()

  return (
    <BaseTokenItem
      token={token}
      onPress={onPress && onPress}
      decimalRulesType="noDecimal"
      hasBottomSpacing
      extraActions={
        onPress &&
        actionButtonText && (
          <Pressable
            testID="rewards-button"
            onPress={onPress}
            style={({ hovered }: any) => [
              flexbox.center,
              flexbox.directionRow,
              common.borderRadiusPrimary,
              {
                width: 70,
                background: GRADIENT_STYLE,
                opacity: hovered ? 0.8 : 1
              }
            ]}
          >
            <Text fontSize={14} weight="medium" color="white">
              {t('{{actionButtonText}}', { actionButtonText })}
            </Text>
          </Pressable>
        )
      }
      rewardsStyle={GRADIENT_STYLE}
      label={
        <Text fontSize={12} weight="regular">
          {typeof description === 'string' ? t('{{description}}', { description }) : description}
        </Text>
      }
      borderRadius={16}
    />
  )
}

export default React.memo(RewardsTokenItem)
