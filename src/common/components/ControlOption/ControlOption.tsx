import React, { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

interface Props {
  title: string
  description: string
  readMoreLink?: string
  renderIcon: React.ReactNode
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
}

const ControlOption: FC<Props> = ({
  title,
  description,
  readMoreLink,
  children,
  renderIcon,
  style,
  onPress
}) => {
  const { theme, themeType } = useTheme()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground },
    duration: 200
  })

  const ParentElement = onPress ? AnimatedPressable : View

  const openReadMoreLink = () => {
    openInTab({
      url: readMoreLink!
    }).catch(() => addToast(t('Failed to open link')))
  }

  return (
    <ParentElement
      style={[
        spacings.pv,
        spacings.ph,
        common.borderRadiusPrimary,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        {
          backgroundColor: theme.secondaryBackground
        },
        onPress ? animStyle : {},
        style
      ]}
      onPress={onPress}
      {...(onPress ? bindAnim : {})}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.pr]}>
        <View
          style={{
            width: 24,
            ...flexbox.center
          }}
        >
          {renderIcon}
        </View>
        <View style={[spacings.ml, flexbox.flex1]}>
          <Text fontSize={16} weight="medium">
            {title}
          </Text>
          <Text appearance="secondaryText" fontSize={14}>
            {description}
            {readMoreLink && (
              <Text
                fontSize={14}
                color={themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary}
                style={{ fontStyle: 'italic' }}
                onPress={openReadMoreLink}
              >
                {' '}
                {t('Read more')}
              </Text>
            )}
          </Text>
        </View>
      </View>
      {children}
    </ParentElement>
  )
}

export default memo(ControlOption)
