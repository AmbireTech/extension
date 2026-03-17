import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewStyle } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  onPress?: () => void
  fallbackBackRoute?: string
  type?: 'primary' | 'secondary'
  style?: ViewStyle
}

const BackButton: FC<Props> = ({ onPress, fallbackBackRoute, type = 'primary', style = {} }) => {
  const { t } = useTranslation()
  const { goBack, canGoBack, navigate } = useNavigation()
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const handlePress = () => {
    if (onPress) {
      onPress()
      return
    }

    if (!canGoBack && fallbackBackRoute) {
      navigate(fallbackBackRoute)
      return
    }

    goBack()
  }

  return type === 'primary' ? (
    <Button
      childrenPosition="left"
      size="large"
      hasBottomSpacing={false}
      type="secondary"
      onPress={handlePress}
      text={t('Back')}
      style={style}
    >
      <LeftArrowIcon color={theme.primary} style={spacings.mrTy} />
    </Button>
  ) : (
    <AnimatedPressable
      {...bindAnim}
      style={[animStyle, flexbox.directionRow, flexbox.alignCenter, style]}
      onPress={handlePress}
    >
      <LeftArrowIcon color={theme.secondaryText} style={spacings.mrTy} />
      <Text fontSize={16} weight="medium" appearance="secondaryText">
        {t('Back')}
      </Text>
    </AnimatedPressable>
  )
}

export default BackButton
