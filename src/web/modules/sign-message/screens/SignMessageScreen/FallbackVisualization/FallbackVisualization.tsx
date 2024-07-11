import { FC, memo, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, Pressable, ScrollView, View } from 'react-native'

import { networks } from '@ambire-common/consts/networks'
import { SignMessageController } from '@ambire-common/controllers/signMessage/signMessage'
import ErrorOutlineIcon from '@common/assets/svg/ErrorOutlineIcon'
import Address from '@common/components/Address'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { getMessageAsText, simplifyTypedMessage } from '@web/modules/sign-message/utils'

import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 20
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

const FallbackVisualization: FC<{
  messageToSign: SignMessageController['messageToSign']
  setHasReachedBottom: (hasReachedBottom: boolean) => void
}> = ({ messageToSign, setHasReachedBottom }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [showRawTypedMessage, setShowRawTypedMessage] = useState(false)
  useEffect(() => {
    const isScrollNotVisible = contentHeight < containerHeight

    setHasReachedBottom(isScrollNotVisible)
  }, [contentHeight, containerHeight, setHasReachedBottom])
  if (!messageToSign) return null

  const { content } = messageToSign

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ErrorOutlineIcon width={36} height={36} />
        <Text style={styles.headerText}>
          <Text appearance="warningText" weight="semiBold">
            {t('Warning:')}{' '}
          </Text>
          <Text appearance="warningText">
            {t('We are not able to decode this message for your convenience.')}
          </Text>
        </Text>
      </View>
      <ScrollView
        onScroll={(e) => {
          if (isCloseToBottom(e.nativeEvent)) setHasReachedBottom(true)
        }}
        onLayout={(e) => {
          setContainerHeight(e.nativeEvent.layout.height)
        }}
        onContentSizeChange={(_, height) => {
          setContentHeight(height)
        }}
        scrollEventThrottle={400}
      >
        <Text weight="regular" appearance="secondaryText" style={spacings.mb}>
          {t('The entries in the message:')}
        </Text>
        <Text selectable weight="regular" appearance="secondaryText" style={spacings.mb}>
          {content.kind === 'typedMessage' ? (
            <Pressable onPress={() => setShowRawTypedMessage(!showRawTypedMessage)}>
              {showRawTypedMessage
                ? JSON.stringify(content.message, null, 4)
                : simplifyTypedMessage(content.message).map((i) => (
                    <div key={JSON.stringify(i)}>
                      <Text style={i.type === 'key' ? { fontWeight: 'bold' } : {}}>
                        {' '.repeat(i.n)}
                        {i.value}
                      </Text>
                    </div>
                  ))}
            </Pressable>
          ) : (
            getMessageAsText(content.message) || t('(Empty message)')
          )}
        </Text>
      </ScrollView>
    </View>
  )
}

export default memo(FallbackVisualization)
