import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable, View } from 'react-native'

import { stringify } from '@ambire-common/libs/richJson/richJson'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-message/components/FallbackVisualization'
import spacings from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import { getSafeEip712DataValue, getSafeEip712HashRows } from './helpers'
import getStyles from './styles'

import type { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import type { Message } from '@ambire-common/interfaces/userRequest'
interface Props {
  accountAddr?: string
  chainId?: bigint
  safeEip712Data?: unknown | null
  withTitle?: boolean
  /** Controls the active tab from the outside, e.g. when the tab bar is rendered elsewhere. */
  activeTab?: ActiveTab
  onTabChange?: (tab: ActiveTab) => void
  /** Hides the internal tab bar, for when it is already rendered by a parent component. */
  hideTabs?: boolean
}

export type ActiveTab = 'hashes' | 'parsed' | 'raw'

const { isSidePanel } = getUiType()

const SafeEip712Data: FC<Props> = ({
  accountAddr,
  chainId,
  safeEip712Data,
  withTitle = true,
  activeTab: controlledActiveTab,
  onTabChange,
  hideTabs = false
}) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const [internalActiveTab, setInternalActiveTab] = useState<ActiveTab>('hashes')
  const activeTab = controlledActiveTab ?? internalActiveTab
  const data = useMemo(() => getSafeEip712DataValue(safeEip712Data), [safeEip712Data])
  const messageToSign = useMemo<ISignMessageController['messageToSign']>(() => {
    if (!data || !accountAddr || !chainId) return null

    return {
      fromRequestId: 'safe-eip-712-data',
      accountAddr,
      chainId,
      signature: null,
      content: {
        ...data,
        kind: 'typedMessage'
      }
    } as Message
  }, [accountAddr, chainId, data])
  const rawMessageContent = useMemo(
    () => (messageToSign?.content ? stringify(messageToSign.content, { pretty: true }) : ''),
    [messageToSign]
  )
  const setHasReachedBottom = useCallback(() => {}, [])
  const rows = useMemo<[string, string][]>(() => (data ? getSafeEip712HashRows(data) : []), [data])
  const tabs = useMemo(
    () =>
      [
        ['hashes', t('Hashes')],
        ['parsed', t('Parsed')],
        ['raw', t('Raw')]
      ] as const,
    [t]
  )
  const handleTabPress = useCallback(
    (tab: ActiveTab) => {
      if (onTabChange) {
        onTabChange(tab)
        return
      }
      setInternalActiveTab(tab)
    },
    [onTabChange]
  )
  const handlePressTab = useCallback(
    (event: GestureResponderEvent, tab: ActiveTab) => {
      event.stopPropagation()
      handleTabPress(tab)
    },
    [handleTabPress]
  )

  if (!messageToSign) return null

  return (
    <View style={isWeb ? spacings.mbLg : spacings.mbSm}>
      <View style={styles.container}>
        {withTitle && (
          <View style={styles.header}>
            <Text fontSize={14} weight="medium" appearance="secondaryText" numberOfLines={1}>
              {t('Hashes and JSON')}
            </Text>
          </View>
        )}
        {!hideTabs && (
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
                    fontSize={14}
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
        {activeTab === 'hashes' && (
          <View style={styles.rows}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text
                  fontSize={12}
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={styles.label}
                >
                  {t(label)}
                </Text>
                <View style={styles.rowRight}>
                  <Text
                    selectable
                    fontSize={12}
                    weight="mono_regular"
                    appearance="primaryText"
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={styles.value}
                  >
                    {value}
                  </Text>
                  <CopyText
                    text={value}
                    iconColor={theme.secondaryText}
                    iconSize={14}
                    shouldStopPropagation
                    style={styles.copyIcon}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
        {activeTab === 'parsed' && (
          <FallbackVisualization
            messageToSign={messageToSign}
            setHasReachedBottom={setHasReachedBottom}
            hasReachedBottom
            scrollEnabled={false}
            withTwoColumnDataRow
            withDecimalIntegerRows
            withRegularParsedText
            parsedValueMaxLength={isMobile || isSidePanel ? 24 : undefined}
            hideTabs
            containerStyle={styles.fallbackVisualization}
            separatorColor={theme.secondaryBackground}
          />
        )}
        {activeTab === 'raw' && (
          <View style={styles.rawContainer}>
            <View style={styles.rawActions}>
              <CopyText
                text={rawMessageContent}
                iconColor={theme.secondaryText}
                iconSize={20}
                shouldStopPropagation
              />
            </View>
            <FallbackVisualization
              messageToSign={messageToSign}
              setHasReachedBottom={setHasReachedBottom}
              hasReachedBottom
              scrollEnabled={false}
              rawOnly
              containerStyle={[styles.fallbackVisualization, styles.rawFallbackVisualization]}
              separatorColor={theme.secondaryBackground}
            />
          </View>
        )}
      </View>
    </View>
  )
}

export default React.memo(SafeEip712Data)
