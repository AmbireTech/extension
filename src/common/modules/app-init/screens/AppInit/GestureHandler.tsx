import { ReactNode } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

const GestureHandler = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme()
  return (
    <GestureHandlerRootView style={[flexbox.flex1, { backgroundColor: theme.primaryBackground }]}>
      {children}
    </GestureHandlerRootView>
  )
}

export default GestureHandler
