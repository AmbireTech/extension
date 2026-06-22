import { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  children: React.ReactNode | React.ReactNode[]
  horizontalAlignment?: 'justifySpaceBetween' | 'justifyCenter' | 'justifyEnd' | 'justifyStart'
  style?: ViewStyle
}

const DialogFooter: FC<Props> = ({ children, horizontalAlignment = 'justifyEnd', style }) => (
  <View
    style={[
      flexbox.directionRow,
      flexbox.alignCenter,
      isWeb && flexbox[horizontalAlignment],
      style
    ]}
  >
    {children}
  </View>
)

export default DialogFooter
