import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import { MessageContentLayoutProps } from './MessageContentLayout'

const MessageContentLayout = ({
  children,
  webStyle,
  webContentContainerStyle,
  webShowsVerticalScrollIndicator
}: MessageContentLayoutProps) => (
  <TabLayoutWrapperMainContent
    style={webStyle}
    contentContainerStyle={webContentContainerStyle}
    showsVerticalScrollIndicator={webShowsVerticalScrollIndicator}
  >
    {children}
  </TabLayoutWrapperMainContent>
)

export default MessageContentLayout
