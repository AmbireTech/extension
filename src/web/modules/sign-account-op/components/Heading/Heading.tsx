import React from 'react'
import { TextStyle } from 'react-native'

import Text from '@common/components/Text'
import styles from './styles'

interface Props {
  text: string
  style: TextStyle
}
const Heading = ({ text, style }: Props) => (
  <Text fontSize={20} weight="semiBold" style={[styles.container, style]}>
    {text}
  </Text>
)

export default Heading
