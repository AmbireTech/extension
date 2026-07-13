import spacings from '@common/styles/spacings'
import { MobileLayoutWrapperMainContent } from '@mobile/components/MobileLayoutWrapper'

import { MessageContentLayoutProps } from './MessageContentLayout'

const MessageContentLayout = ({ children, withScroll }: MessageContentLayoutProps) => (
  <MobileLayoutWrapperMainContent contentContainerStyle={spacings.ph0} withScroll={withScroll}>
    {children}
  </MobileLayoutWrapperMainContent>
)

export default MessageContentLayout
