import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  title: string
  children?: React.ReactNode
  style?: ViewStyle
}

const SettingsPageHeader: FC<Props> = ({ title, children, style }) => {
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()
  const isWidthL = maxWidthSize('l')

  return (
    <View
      style={[
        isWidthL && flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        isWidthL ? spacings.mbXl : spacings.mbLg,
        {
          minHeight: 48
        },
        style
      ]}
    >
      <Text fontSize={20} weight="medium">
        {t(title)}
      </Text>
      {children}
    </View>
  )
}

export default SettingsPageHeader
