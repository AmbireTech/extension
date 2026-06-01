import { isHexString } from 'ethers'
import { FC, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, NativeScrollEvent, Pressable, ScrollView, View } from 'react-native'

import { Hex } from '@ambire-common/interfaces/hex'
import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import { IrMessage } from '@ambire-common/libs/humanizer/interfaces'
import { isValidAddress } from '@ambire-common/services/address'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import CopyText from '@common/components/CopyText'
import HumanizerAddress from '@common/components/HumanizerAddress'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import AnimatedDownArrow from '@common/modules/account-picker/components/AccountsOnPageList/AnimatedDownArrow'
import isErc7730Visualization from '@common/modules/sign-message/utils/isErc7730Visualization'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getMessageAsText, simplifyTypedMessage } from '@common/utils/messageToString'

import { getParsedMessageValue } from './helpers'
import getStyles from './styles'

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: NativeScrollEvent) => {
  const paddingToBottom = 40
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom
}

type MessageItem = {
  value: string
  type: string
  n: number
  path: string
  isArrayItem?: boolean
}

type ParsedMessageRow = MessageItem & {
  label: string
  componentToReturn: React.ReactNode
}

const getRowLabel = (path: string, fallback: string) => {
  const lastPathPart = path.split('.').filter(Boolean).pop()

  return lastPathPart || fallback
}

const useParsedMessageRows = (
  message: unknown,
  chainId: bigint,
  responsiveSizeMultiplier: number,
  t: (key: string) => string
): ParsedMessageRow[] => {
  return useMemo(() => {
    if (!message) return []

    return simplifyTypedMessage(message)
      .filter((i: MessageItem) => i.type === 'value')
      .map((i: MessageItem) => {
        let componentToReturn: React.ReactNode = i.value
        const valueAsString = String(i.value)

        const isProbablyADateWIthinRange =
          parseInt(valueAsString, 10) * 1000 > new Date('01/01/2000').getTime() &&
          parseInt(valueAsString, 10) * 1000 < new Date('01/01/2100').getTime()
        const isInfiniteAmount = parseInt(valueAsString, 10)?.toString(16) === '1'.padEnd(65, '0')

        if (isValidAddress(valueAsString))
          componentToReturn = (
            <HumanizerAddress
              chainId={BigInt(chainId)}
              address={valueAsString}
              fontSize={14 * responsiveSizeMultiplier}
              actionsMode="inline"
            />
          )
        else if (isProbablyADateWIthinRange)
          componentToReturn = new Date(parseInt(valueAsString, 10) * 1000).toUTCString()
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

        return {
          ...i,
          label: getRowLabel(i.path, valueAsString),
          componentToReturn
        }
      })
  }, [message, chainId, responsiveSizeMultiplier, t])
}

type ActiveTab = 'parsed' | 'raw'

const FallbackVisualization: FC<{
  messageToSign: ISignMessageController['messageToSign']
  humanizedMessage?: IrMessage
  setHasReachedBottom: (hasReachedBottom: boolean) => void
  hasReachedBottom: boolean
  responsiveSizeMultiplier?: number
  withScrollDownArrow?: boolean
  rawOnly?: boolean
  scrollEnabled?: boolean
  withCompactDataRow?: boolean
}> = ({
  messageToSign,
  humanizedMessage,
  setHasReachedBottom,
  hasReachedBottom,
  responsiveSizeMultiplier = 1,
  withScrollDownArrow = false,
  rawOnly = false,
  scrollEnabled = true,
  withCompactDataRow = false
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const [containerHeight, setContainerHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  const [activeTab, setActiveTab] = useState<ActiveTab>('parsed')
  const content = messageToSign?.content
  const chainId = messageToSign?.chainId || 1n
  const isTypedMessage = content?.kind === 'typedMessage'
  const erc7730Visualizations = useMemo(
    () => humanizedMessage?.fullVisualization?.filter(isErc7730Visualization) || [],
    [humanizedMessage?.fullVisualization]
  )
  const parsedRows = useParsedMessageRows(
    content?.kind === 'typedMessage' ? content.message : null,
    chainId,
    responsiveSizeMultiplier,
    t
  )
  const tabs = useMemo(
    () =>
      [
        ['parsed', t('Parsed')],
        ['raw', t('Raw')]
      ] as const,
    [t]
  )
  const handleTabPress = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
  }, [])
  const handlePressTab = useCallback(
    (event: GestureResponderEvent, tab: ActiveTab) => {
      event.stopPropagation()
      handleTabPress(tab)
    },
    [handleTabPress]
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
    activeTab,
    rawOnly,
    hasReachedBottom
  ])
  if (!messageToSign || !content) return null

  return (
    <View style={[styles.container]}>
      {isTypedMessage && !rawOnly && (
        <View style={styles.tabHeader}>
          {tabs.map(([tab, label]) => {
            const isActive = activeTab === tab

            return (
              <Pressable
                key={tab}
                onPress={(event) => handlePressTab(event, tab)}
                style={[
                  styles.tabButton,
                  {
                    borderBottomColor: isActive ? theme.secondaryAccent400 : 'transparent'
                  }
                ]}
              >
                <Text
                  fontSize={14 * responsiveSizeMultiplier}
                  weight={isActive ? 'semiBold' : 'medium'}
                  color={isActive ? theme.secondaryAccent400 : theme.secondaryText}
                >
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}
      <ScrollView
        scrollEnabled={scrollEnabled}
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
        {isTypedMessage && (rawOnly || activeTab === 'raw') && (
          <Text
            selectable
            weight="regular"
            fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={styles.rawText}
          >
            {JSON.stringify(content, null, 4)}
          </Text>
        )}
        {isTypedMessage &&
          !rawOnly &&
          activeTab === 'parsed' &&
          (erc7730Visualizations.length ? (
            <HumanizedVisualization
              data={erc7730Visualizations}
              chainId={chainId}
              sizeMultiplierSize={responsiveSizeMultiplier}
              textSize={14}
              hasPadding={false}
              erc7730Mode="description"
            />
          ) : (
            <View>
              {parsedRows.map((i) => (
                <View
                  key={`${i.path}-${i.value}`}
                  style={[
                    styles.parsedRow,
                    {
                      marginBottom:
                        i.isArrayItem && isHexString(String(i.value))
                          ? SPACING_TY * responsiveSizeMultiplier
                          : 0
                    }
                  ]}
                >
                  <Text
                    selectable
                    weight="semiBold"
                    fontSize={14 * responsiveSizeMultiplier}
                    appearance="secondaryText"
                    style={[
                      styles.parsedLabel,
                      { marginLeft: Math.max(i.n - 1, 0) * SPACING_SM * responsiveSizeMultiplier }
                    ]}
                  >
                    {i.label}
                  </Text>
                  <View style={styles.parsedValue}>
                    {typeof i.componentToReturn === 'string' ||
                    typeof i.componentToReturn === 'number' ? (
                      <>
                        <Text
                          selectable
                          weight="medium"
                          fontSize={14 * responsiveSizeMultiplier}
                          appearance="primaryText"
                          style={styles.parsedValueText}
                        >
                          {withCompactDataRow
                            ? getParsedMessageValue(i.label, i.componentToReturn)
                            : i.componentToReturn}
                        </Text>
                        {withCompactDataRow &&
                          i.label === 'data' &&
                          typeof i.componentToReturn === 'string' && (
                            <CopyText
                              text={i.componentToReturn}
                              iconColor={theme.secondaryText}
                              iconSize={16 * responsiveSizeMultiplier}
                              style={spacings.mlMi}
                            />
                          )}
                      </>
                    ) : (
                      i.componentToReturn
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
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
    </View>
  )
}

export default memo(FallbackVisualization)
