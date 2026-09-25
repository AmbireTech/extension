import React, { FC } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

/** The header of the statuses table: the network column, then one per value, sized like the row. */
const NetworkStatusesHeader: FC<{
  networkLabel: string
  columns: { label: string; flex: number }[]
}> = ({ networkLabel, columns }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        { flexDirection: 'row' },
        spacings.pbTy,
        {
          borderBottomWidth: 2,
          borderBottomColor: theme.secondaryBackground
        }
      ]}
    >
      <View style={{ flex: 1.75 }}>
        <Text
          fontSize={isMobile ? 10 : 12}
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
