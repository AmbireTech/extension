import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  title: string
  children?: React.ReactNode
}

const SettingsPageHeader: FC<Props> = ({ title, children }) => {
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()
  const isWidthXl = maxWidthSize('xl')

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        isWidthXl ? spacings.mbXl : spacings.mbLg,
        {
          minHeight: 48
        }
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
