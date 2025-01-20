import React, { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'

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
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { t } = useTranslation()

  const ParentElement = onPress ? Pressable : View

  const openReadMoreLink = () => {
    openInTab(readMoreLink, false).catch(() => addToast(t('Failed to open link')))
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
        style
      ]}
      onPress={onPress}
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
                appearance="primary"
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
