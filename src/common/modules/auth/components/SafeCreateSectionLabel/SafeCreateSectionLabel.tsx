import React from 'react'
import { StyleProp, TextStyle } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

type Props = {
  children: string
  style?: StyleProp<TextStyle>
}

/** The uppercase label above each card of the Safe create screens and the add owner sheet */
const SafeCreateSectionLabel = ({ children, style }: Props) => (
  <Text
    fontSize={12}
    weight="medium"
    appearance="secondaryText"
    style={[text.uppercase, spacings.mtLg, spacings.mbTy, style]}
  >
    {children}
  </Text>
)

export default React.memo(SafeCreateSectionLabel)
