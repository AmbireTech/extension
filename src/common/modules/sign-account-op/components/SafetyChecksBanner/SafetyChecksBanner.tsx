import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

export interface SafetyCheckBannerAction {
  id: string
  text: string
  onPress: () => void
}

interface Props {
  title?: string
  text: string | React.ReactNode
  secondaryText?: string | React.ReactNode
  type: 'error' | 'warning'
  style?: ViewStyle
  primaryAction?: SafetyCheckBannerAction
  secondaryActions?: SafetyCheckBannerAction[]
}

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningIcon
}

const SafetyCheckBanner = ({
  type,
  title,
  text,
  secondaryText,
  style,
  primaryAction,
  secondaryActions
}: Props) => {
  const Icon = ICON_MAP[type]
  const { styles, theme } = useTheme(getStyles)
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

  const translatedTitle = title ? t(title) : TITLE_MAP[type]
  const translatedText = typeof text === 'string' ? t(text) : text
  const translatedSecondaryText =
    typeof secondaryText === 'string' ? t(secondaryText) : secondaryText

  return (
    <View
      style={[
        styles.container,
        {
          borderLeftColor: theme[`${type}Decorative`]
        },
        style
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme[`${type}Background`] }]}>
        <Icon width={28} height={28} color={theme[`${type}Decorative`]} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text selectable fontSize={16} weight="semiBold" style={styles.title}>
            {translatedTitle}
          </Text>
          <Badge type={type} text={BADGE_TEXT_MAP[type]} size="sm" style={styles.badge} />
        </View>
        <Text selectable fontSize={12} appearance="secondaryText">
          {translatedText}
        </Text>
        {!!translatedSecondaryText && (
          <View
            style={[styles.secondaryContainer, { backgroundColor: theme[`${type}Background`] }]}
          >
            <InfoIcon width={16} height={16} color={theme[`${type}Text`]} />
            <Text selectable fontSize={12} appearance={`${type}Text`} style={styles.secondaryText}>
              {translatedSecondaryText}
            </Text>
          </View>
        )}
        {(!!primaryAction || !!secondaryActions?.length) && (
          <View style={styles.actions}>
            {!!primaryAction && (
              <Button
                testID={primaryAction.id}
                type="primary"
                size="small"
                text={t(primaryAction.text)}
                onPress={primaryAction.onPress}
                submitOnEnter={false}
                hasBottomSpacing={false}
                style={secondaryActions?.length ? styles.primaryAction : undefined}
              />
            )}
            {secondaryActions?.map((action, index) => (
              <Button
                key={action.id}
                testID={action.id}
                type="outline"
                size="small"
                text={t(action.text)}
                onPress={action.onPress}
                submitOnEnter={false}
                hasBottomSpacing={false}
                style={
                  index < secondaryActions.length - 1
                    ? isMobile
                      ? spacings.mbTy
                      : spacings.mrTy
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(SafetyCheckBanner)
