import useCompactLayout from '@common/hooks/useCompactLayout'
import spacings from '@common/styles/spacings'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import { MessageContentLayoutProps } from './MessageContentLayout'

const MessageContentLayout = ({
  children,
  webStyle,
  webContentContainerStyle,
  webShowsVerticalScrollIndicator
}: MessageContentLayoutProps) => {
  const { isNarrowWebLayout } = useCompactLayout()

  // In a narrow view the header and the footer already space the content like on mobile,
  // whatever the call site sets
  return (
    <TabLayoutWrapperMainContent
      style={isNarrowWebLayout ? [webStyle, spacings.mb0] : webStyle}
      contentContainerStyle={
        isNarrowWebLayout
          ? [webContentContainerStyle, spacings.mt0, spacings.pt0, spacings.pbSm]
          : webContentContainerStyle
      }
      showsVerticalScrollIndicator={webShowsVerticalScrollIndicator}
    >
      {children}
    </TabLayoutWrapperMainContent>
  )
}

export default MessageContentLayout
