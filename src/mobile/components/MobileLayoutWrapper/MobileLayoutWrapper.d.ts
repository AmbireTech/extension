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
  // When true (default), the container shrinks by the keyboard's overlap so the
  // content compresses and the footer is pushed up above the keyboard instead of
  // being covered by it. Set to false to keep the layout fixed.
  keyboardAwareFooter?: boolean
}

export interface MobileLayoutWrapperMainContentProps extends WrapperProps {
  children: ReactNode
  withScroll?: boolean
  wrapperRef?: any
  withBackButton?: boolean
  keyboardAwareScrollViewProps?: KeyboardAwareScrollViewProps
  onBackButtonPress?: () => void
  withHorizontalPadding?: boolean
  rightIcon?: ReactNode
  title?: string
  /**
   * Content that floats on top of the main content, starting right under the
   * header (e.g. a popover pointing to `rightIcon`). It doesn't scroll with the
   * content. Rendered only when there is a header (`title` or `withBackButton`).
   */
  headerOverlay?: ReactNode
}

declare const MobileLayoutContainer: React.FC<MobileLayoutContainerProps>
declare const MobileLayoutWrapperMainContent: React.FC<MobileLayoutWrapperMainContentProps>

export { MobileLayoutContainer, MobileLayoutWrapperMainContent }
