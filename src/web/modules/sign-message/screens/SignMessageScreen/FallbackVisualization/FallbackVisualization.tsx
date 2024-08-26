import { FC, memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, View } from 'react-native'

import { SignMessageController } from '@ambire-common/controllers/signMessage/signMessage'
import { isValidAddress } from '@ambire-common/services/address'
import Address from '@common/components/Address'
import MultistateToggleButton from '@common/components/MultistateToggleButton'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getMessageAsText, simplifyTypedMessage } from '@common/utils/messageToString'

import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const FallbackVisualization: FC<{
  messageToSign: SignMessageController['messageToSign']
  setHasReachedBottom: (hasReachedBottom: boolean) => void
  hasReachedBottom: boolean
}> = ({ messageToSign, setHasReachedBottom, hasReachedBottom }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [showRawTypedMessage, setShowRawTypedMessage] = useState(false)
  useEffect(() => {
    if (!messageToSign || !containerHeight || !contentHeight) return
    const isScrollNotVisible = contentHeight < containerHeight
    if (setHasReachedBottom && !hasReachedBottom) setHasReachedBottom(isScrollNotVisible)
  }, [
    contentHeight,
    containerHeight,
    setHasReachedBottom,
    messageToSign,
    showRawTypedMessage,
    hasReachedBottom
  ])
  if (!messageToSign) return null

  const { content } = messageToSign

  return (
    <View style={[styles.container]}>
      <ScrollView
        onScroll={(e) => {
          if (isCloseToBottom(e.nativeEvent) && setHasReachedBottom) setHasReachedBottom(true)
        }}
        onLayout={(e) => {
          setContainerHeight(e.nativeEvent.layout.height)
        }}
        onContentSizeChange={(_, height) => {
          setContentHeight(height)
        }}
        scrollEventThrottle={400}
      >
        <Text
          selectable
          weight="regular"
          fontSize={maxWidthSize('xl') ? 14 : 12}
          appearance="secondaryText"
          style={spacings.mb}
        >
          {content.kind === 'typedMessage' &&
            showRawTypedMessage &&
            JSON.stringify(content, null, 4)}
          {content.kind === 'typedMessage' &&
            !showRawTypedMessage &&
            simplifyTypedMessage(content.message).map((i, index: number) => (
              <div style={index < 2 ? { maxWidth: '75%' } : {}} key={JSON.stringify(i)}>
                <Text style={[i.type === 'key' && { fontWeight: 'bold' }]}>
                  {'    '.repeat(i.n)}
                  {isValidAddress(i.value) ? <Address address={i.value} /> : i.value}
                </Text>
              </div>
            ))}
          {content.kind !== 'typedMessage' &&
            (getMessageAsText(content.message) || t('(Empty message)'))}
        </Text>
      </ScrollView>
      {content.kind === 'typedMessage' && (
        <MultistateToggleButton
          style={styles.toggleButton}
          states={[
            { text: 'Parsed', callback: () => setShowRawTypedMessage(false) },
            { text: 'Raw', callback: () => setShowRawTypedMessage(true) }
          ]}
        />
      )}
    </View>
  )
}

export default memo(FallbackVisualization)
