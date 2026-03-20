import React from 'react'
import { View } from 'react-native'

import { isMobile, isWeb } from '@common/config/env'
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
        isWeb && spacings.mhMi,
        isWeb && spacings.mvMi,
        isMobile ? spacings.phSm : spacings.ph,
        {
          borderRadius: 12,
          height: isMobile ? 56 : 68,
          backgroundColor: theme.secondaryBackground,
          borderBottomWidth: isMobile ? 0 : 1,
          borderBottomColor: theme.neutral400
        }
      ]}
    >
      <Header.AccountDataDetailed />
      {isWeb && <Header.Logo />}
    </View>
  )
}

export default ActionHeader
