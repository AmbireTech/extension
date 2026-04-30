import React from 'react'
import { View } from 'react-native'

import {
  MobileLayoutContainerProps,
  MobileLayoutWrapperMainContentProps
} from './MobileLayoutWrapper'

// Web stubs: these components are only rendered on native (consumers in
// shared code gate them with `isMobile`). The native implementation
// (`MobileLayoutWrapper.native.tsx`) imports `react-native-keyboard-controller`,
// which is incompatible with LavaMoat used in the production webkit build
// and surfaces as `Cannot access '__WEBPACK_DEFAULT_EXPORT__' before initialization`.
// Keeping these stubs free of that import excludes the offending module from the web bundle.

const MobileLayoutContainer: React.FC<MobileLayoutContainerProps> = ({ children }) => (
  <View>{children}</View>
)

const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps> = ({
  children
}) => <View>{children}</View>

export { MobileLayoutContainer, MobileLayoutWrapperMainContent }
