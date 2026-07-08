import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable, View } from 'react-native'

import type { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import type { Message } from '@ambire-common/interfaces/userRequest'
import { stringify } from '@ambire-common/libs/richJson/richJson'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-message/components/FallbackVisualization'
import spacings from '@common/styles/spacings'

import { getSafeEip712DataValue, getSafeEip712HashRows } from './helpers'
import getStyles from './styles'

interface Props {
  accountAddr?: string
  chainId?: bigint
  safeEip712Data?: unknown | null
}

type ActiveTab = 'hashes' | 'parsed' | 'raw'

const SafeEip712Data: FC<Props> = ({ accountAddr, chainId, safeEip712Data }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const [activeTab, setActiveTab] = useState<ActiveTab>('hashes')
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
    [messageToSign?.content]
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

  if (!messageToSign) return null

  return (
    <View style={isWeb ? spacings.mbLg : spacings.mb}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text fontSize={14} weight="medium" appearance="secondaryText" numberOfLines={1}>
            {t('Safe hashes and JSON')}
          </Text>
        </View>
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
            withCompactDataRow
            withDecimalIntegerRows
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
