import React, { ReactNode } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

interface Props {
  label: string
  children: ReactNode
}

/** A label/value row inside the staking details card. */
const DetailRow = ({ label, children }: Props) => {
  const { styles } = useTheme(getStyles)

  return (
    <View style={styles.detailRow}>
      <Text fontSize={13} appearance="secondaryText">
        {label}
      </Text>
      {children}
    </View>
  )
}

export default React.memo(DetailRow)
