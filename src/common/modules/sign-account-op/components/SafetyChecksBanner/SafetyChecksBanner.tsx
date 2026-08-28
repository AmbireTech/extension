import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useTrustDapp from '@common/hooks/useTrustDapp'

import getStyles from './styles'

interface Props {
  title?: string
  text: string | React.ReactNode
  secondaryText?: string | React.ReactNode
  type: 'error' | 'warning'
  style?: ViewStyle
  /**
   * The apps this banner warns about that the user may mark as trusted, silencing it for them.
   * Comes straight off the controller banner, which sets it only where the warning is about the
   * apps' own hosting and their address identifies them - so it is empty for most banners.
   */
  trustableDappUrls?: string[]
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
  trustableDappUrls
}: Props) => {
  const Icon = ICON_MAP[type]
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { trustDapp } = useTrustDapp()

  const onTrust = useCallback(() => {
    trustableDappUrls?.forEach((url) => trustDapp(url))
  }, [trustableDappUrls, trustDapp])

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
          {!!trustableDappUrls?.length && (
            <Button
              type="warning"
              size="tiny"
              text={t('Trust this app')}
              onPress={onTrust}
              hasBottomSpacing={false}
              testID="trust-dapp-button"
              style={[styles.badge, styles.trustButton]}
            />
          )}
          {!trustableDappUrls?.length && (
            <Badge type={type} text={BADGE_TEXT_MAP[type]} size="sm" style={styles.badge} />
          )}
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
      </View>
    </View>
  )
}

export default React.memo(SafetyCheckBanner)
