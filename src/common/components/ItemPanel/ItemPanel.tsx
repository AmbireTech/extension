import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

type ItemPanelProps = {
  children: React.ReactNode
  style?: ViewStyle
}

/** A rounded panel on the secondary background, used to frame the fields of a form */
const ItemPanel: FC<ItemPanelProps> = ({ children, style = {} }) => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        ...spacings.phSm,
        ...spacings.pvSm,
        backgroundColor: theme.secondaryBackground,
        borderRadius: BORDER_RADIUS_PRIMARY,
        ...style
      }}
    >
      {children}
    </View>
  )
}

export default ItemPanel
