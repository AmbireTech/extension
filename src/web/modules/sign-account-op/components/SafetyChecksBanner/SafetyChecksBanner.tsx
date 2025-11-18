import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  text: string | React.ReactNode
  type: 'error' | 'warning'
  style?: ViewStyle
}

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon
}

const SafetyCheckBanner = ({ type, text, style }: Props) => {
  const Icon = ICON_MAP[type]
  const { theme } = useTheme()
  const { t } = useTranslation()

  const TITLE_MAP = useMemo(
    () => ({
      error: t('Potential danger!'),
      warning: t('Warning!')
    }),
    [t]
  )

  const BADGE_TEXT_MAP = useMemo(
    () => ({
      error: t('Danger'),
      warning: t('Warning')
    }),
    [t]
  )

  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvSm,
        common.borderRadiusPrimary,
        {
          backgroundColor: theme[`${type}Background`]
        },
        style
      ]}
    >
      <View style={flexbox.flex1}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.mbTy
          ]}
        >
          <Text
            selectable
            appearance={`${type}Text`}
            fontSize={20}
            weight="semiBold"
            numberOfLines={1}
          >
            {TITLE_MAP[type]}
          </Text>
          <Badge type={type} text={BADGE_TEXT_MAP[type]} size="sm">
            <Icon width={16} height={16} color={theme[`${type}Decorative`]} style={spacings.mlMi} />
          </Badge>
        </View>
        <Text fontSize={12} appearance={`${type}Text`} weight="medium">
          {text}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(SafetyCheckBanner)
