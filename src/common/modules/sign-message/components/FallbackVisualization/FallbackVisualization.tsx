import { isHexString } from 'ethers'
import { FC, memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeScrollEvent, ScrollView, View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import { isValidAddress } from '@ambire-common/services/address'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import HumanizerAddress from '@common/components/HumanizerAddress'
import MultistateToggleButton from '@common/components/MultistateToggleButton'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import AnimatedDownArrow from '@common/modules/account-picker/components/AccountsOnPageList/AnimatedDownArrow'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getMessageAsText, simplifyTypedMessage } from '@common/utils/messageToString'

import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 40
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

type MessageItem = {
  value: string
  type: string
  n: number
  isArrayItem?: boolean
}

type ProcessedItem = MessageItem & {
  componentToReturn: React.ReactNode
}

const useProcessedMessageItems = (
  message: any,
  chainId: bigint,
  responsiveSizeMultiplier: number,
  t: (key: string) => string
): ProcessedItem[] => {
  return useMemo(() => {
    return simplifyTypedMessage(message).map((i: MessageItem) => {
      let componentToReturn: React.ReactNode = i.value

      const isProbablyADateWIthinRange =
        parseInt(i.value, 10) * 1000 > new Date('01/01/2000').getTime() &&
        parseInt(i.value, 10) * 1000 < new Date('01/01/2100').getTime()
      const isInfiniteAmount = parseInt(i.value, 10)?.toString(16) === '1'.padEnd(65, '0')

      if (isValidAddress(i.value))
        componentToReturn = (
          <HumanizerAddress
            chainId={BigInt(chainId)}
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

      return { ...i, componentToReturn }
    })
  }, [message, chainId, responsiveSizeMultiplier, t])
}

const FallbackVisualization: FC<{
  messageToSign: ISignMessageController['messageToSign']
  setHasReachedBottom: (hasReachedBottom: boolean) => void
  hasReachedBottom: boolean
  responsiveSizeMultiplier?: number
  withScrollDownArrow?: boolean
}> = ({
  messageToSign,
  setHasReachedBottom,
  hasReachedBottom,
  responsiveSizeMultiplier = 1,
  withScrollDownArrow = false
}) => {
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

  const processedItems =
    content.kind === 'typedMessage'
      ? useProcessedMessageItems(
          content.message,
          messageToSign.chainId,
          responsiveSizeMultiplier,
          t
        )
      : []

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
        scrollEventThrottle={16}
      >
        {content.kind === 'typedMessage' && showRawTypedMessage && (
          <Text
            selectable
            weight="regular"
            fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={spacings.mb}
          >
            {JSON.stringify(content, null, 4)}
          </Text>
        )}
        {content.kind === 'typedMessage' && !showRawTypedMessage && (
          <>
            {processedItems.map((i) => (
              <View
                key={i.type + i.value}
                style={{
                  marginBottom:
                    i.isArrayItem && isHexString(i.value) ? 8 * responsiveSizeMultiplier : 0,
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}
              >
                <Text
                  selectable
                  weight={i.type === 'key' ? 'semiBold' : 'regular'}
                  fontSize={16 * responsiveSizeMultiplier}
                  appearance="secondaryText"
                  style={{ marginLeft: i.n * 20 * responsiveSizeMultiplier }}
                >
                  {i.componentToReturn}
                </Text>
              </View>
            ))}
          </>
        )}
        {content.kind === 'authorization-7702' && (
          <Text
            selectable
            weight="regular"
            fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={spacings.mb}
          >
            {getMessageAsText(content.message as Hex)}
          </Text>
        )}
        {(content.kind === 'message' || content.kind === 'siwe') && (
          <Text
            selectable
            weight="regular"
            fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={spacings.mb}
          >
            {getMessageAsText(content.message as Hex) || t('(Empty message)')}
          </Text>
        )}
      </ScrollView>
      {!!containerHeight && !!contentHeight && withScrollDownArrow && (
        <AnimatedDownArrow
          isVisible={contentHeight > containerHeight && !hasReachedBottom}
          appearance="primary"
        />
      )}
      {content.kind === 'typedMessage' && (
        <MultistateToggleButton style={styles.toggleButton} states={statesForMultistateButton} />
      )}
    </View>
  )
}

export default memo(FallbackVisualization)
