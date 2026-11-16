import React, { FC } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** The statuses table header, with columns sized like the rows. */
const NetworkStatusesHeader: FC<{
  networkLabel: string
  columns: { label: string; flex: number }[]
}> = ({ networkLabel, columns }) => {
  return (
    // The sheet's fixed header already sets it apart from the rows, with its own gap
    <View style={flexbox.directionRow}>
      <View style={{ flex: 1.75 }}>
        <Text
          fontSize={isMobile ? 10 : 12}
          numberOfLines={1}
          weight="semiBold"
          appearance="secondaryText"
          style={spacings.plTy}
        >
          {networkLabel}
        </Text>
      </View>
      {columns.map(({ label, flex }) => (
        <Text
          key={label}
          fontSize={isMobile ? 10 : 12}
          numberOfLines={1}
          weight="semiBold"
          appearance="secondaryText"
          style={{ flex, textAlign: 'center' }}
        >
          {label}
        </Text>
      ))}
    </View>
  )
}

export default React.memo(NetworkStatusesHeader)
