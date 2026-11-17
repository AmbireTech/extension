import React, { FC } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** The statuses table header, with columns sized like the rows. */
const NetworkStatusesHeader: FC<{
  networkLabel: string
  columns: { label: string; flex: number }[]
}> = ({ networkLabel, columns }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
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
