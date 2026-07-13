import { FC, ReactNode } from 'react'
import { StyleProp, ViewStyle } from 'react-native'

// Platform-resolved layout wrapper for the shared sign-message Content
// components. Previously each Content imported BOTH the web TabLayoutWrapper and
// the mobile MobileLayoutWrapper and switched at render (a cross-env import in
// common). This resolves to the right wrapper per platform; the web-only style
// props are ignored on native and vice versa, preserving the exact prior props.
export interface MessageContentLayoutProps {
  children: ReactNode
  // Mobile: forwarded to MobileLayoutWrapperMainContent (content padding is
  // always ph0 for these screens, so it's baked into the native impl).
  withScroll?: boolean
  // Web: forwarded to TabLayoutWrapperMainContent.
  webStyle?: StyleProp<ViewStyle>
  webContentContainerStyle?: StyleProp<ViewStyle>
  webShowsVerticalScrollIndicator?: boolean
}

declare const MessageContentLayout: FC<MessageContentLayoutProps>

export default MessageContentLayout
