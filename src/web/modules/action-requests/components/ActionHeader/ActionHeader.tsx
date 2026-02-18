import React from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const ActionHeader = () => {
  const { theme } = useTheme()
  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        spacings.mhMi,
        spacings.mvMi,
        spacings.ph,
        {
          borderRadius: 12,
          height: 68,
          backgroundColor: theme.secondaryBackground,
          borderBottomWidth: 1,
          borderBottomColor: theme.neutral400
        }
      ]}
    >
      <Header.AccountDataDetailed />
      <Header.Logo />
    </View>
  )
}

export default ActionHeader
