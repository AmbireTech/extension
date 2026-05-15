import { ColorValue, ReactNode, ViewStyle } from 'react-native'
import { KeyboardAwareScrollViewProps } from 'react-native-keyboard-controller'

import { WrapperProps } from '@common/components/ScrollableWrapper'

export type MobileLayoutContainerProps = {
  backgroundColor?: ColorValue
  header?: ReactNode
  footer?: ReactNode
  footerStyle?: ViewStyle
  children: ReactNode | ReactNode[]
  renderDirectChildren?: () => ReactNode
  style?: ViewStyle
  withHorizontalPadding?: boolean
  withTopPadding?: boolean
  withBottomInset?: boolean
}

export interface MobileLayoutWrapperMainContentProps extends WrapperProps {
  children: ReactNode
  withScroll?: boolean
  wrapperRef?: any
  withBackButton?: boolean
  keyboardAwareScrollViewProps?: KeyboardAwareScrollViewProps
  onBackButtonPress?: () => void
  rightIcon?: ReactNode
  title?: string
  step?: number
  totalSteps?: number
}

declare const MobileLayoutContainer: React.FC<MobileLayoutContainerProps>
declare const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps>

export { MobileLayoutContainer, MobileLayoutWrapperMainContent }
