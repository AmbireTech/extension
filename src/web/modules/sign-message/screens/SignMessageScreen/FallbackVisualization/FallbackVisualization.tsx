import { isHexString } from 'ethers'
import { FC, memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, View } from 'react-native'

import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import { isPlainTextMessage } from '@ambire-common/libs/transfer/userRequest'
import { isValidAddress } from '@ambire-common/services/address'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import HumanizerAddress from '@common/components/HumanizerAddress'
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
  messageToSign: ISignMessageController['messageToSign']
  setHasReachedBottom: (hasReachedBottom: boolean) => void
  hasReachedBottom: boolean
  responsiveSizeMultiplier?: number
}> = ({ messageToSign, setHasReachedBottom, hasReachedBottom, responsiveSizeMultiplier = 1 }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [showRawTypedMessage, setShowRawTypedMessage] = useState(false)
  const statesForMultistateButton = useMemo(
    () => [
      { text: 'Parsed', callback: () => setShowRawTypedMessage(false) },
      { text: 'Raw', callback: () => setShowRawTypedMessage(true) }
    ],
    []
  )
  useEffect(() => {
    if (!messageToSign || !containerHeight || !contentHeight) return
    const isScrollNotVisible = contentHeight <= containerHeight
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
          fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
          appearance="secondaryText"
          style={spacings.mb}
        >
          {content.kind === 'typedMessage' &&
            showRawTypedMessage &&
            JSON.stringify(content, null, 4)}
          {content.kind === 'typedMessage' &&
            !showRawTypedMessage &&
            simplifyTypedMessage(content.message).map((i, index: number) => {
              let componentToReturn = i.value

              const isProbablyADateWIthinRange =
                parseInt(i.value, 10) * 1000 > new Date('01/01/2000').getTime() &&
                parseInt(i.value, 10) * 1000 < new Date('01/01/2100').getTime()
              const isInfiniteAmount = parseInt(i.value, 10)?.toString(16) === '1'.padEnd(65, '0')

              if (isValidAddress(i.value))
                componentToReturn = (
                  <HumanizerAddress
                    chainId={messageToSign.chainId}
                    address={i.value}
                    fontSize={14 * responsiveSizeMultiplier}
                  />
                )
              else if (isProbablyADateWIthinRange)
                componentToReturn = new Date(parseInt(i.value, 10) * 1000).toUTCString()
              else if (isInfiniteAmount)
                componentToReturn = (
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Text
                      fontSize={16 * responsiveSizeMultiplier}
                      weight="semiBold"
                      style={[spacings.mrTy]}
                    >
                      {t('Infinite amount')}
                    </Text>
                    <WarningFilledIcon
                      width={16 * responsiveSizeMultiplier}
                      height={16 * responsiveSizeMultiplier}
                    />
                  </View>
                )
              return (
                <div
                  style={{
                    ...(index < 2 ? { maxWidth: '75%' } : {}),
                    ...(i.isArrayItem && isHexString(i.value) ? { marginBottom: '0.5rem' } : {})
                  }}
                  key={JSON.stringify(i)}
                >
                  <Text
                    style={[
                      i.type === 'key' && { fontWeight: 'bold' },
                      { marginLeft: i.n * 20 * responsiveSizeMultiplier }
                    ]}
                    fontSize={16 * responsiveSizeMultiplier}
                  >
                    {componentToReturn}
                  </Text>
                </div>
              )
            })}
          {content.kind === 'authorization-7702' && getMessageAsText(content.message)}

          {isPlainTextMessage(content) &&
            (getMessageAsText(content.message) || t('(Empty message)'))}
        </Text>
      </ScrollView>
      {content.kind === 'typedMessage' && (
        <MultistateToggleButton style={styles.toggleButton} states={statesForMultistateButton} />
      )}
    </View>
  )
}

export default memo(FallbackVisualization)
