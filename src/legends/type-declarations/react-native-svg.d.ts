import type { StyleProp, ViewStyle } from 'react-native'

declare module 'react-native-svg/lib/typescript/lib/extract/types' {
  interface CommonPathProps {
    /**
     * react-native-svg has no typed `style` prop on shapes, but react-native-web
     * forwards it to the DOM node, where `mixBlendMode` works.
     */
    style?: StyleProp<ViewStyle>
  }
}
