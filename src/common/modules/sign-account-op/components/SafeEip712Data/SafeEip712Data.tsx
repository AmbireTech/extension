import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import { Message } from '@ambire-common/interfaces/userRequest'
import CopyText from '@common/components/CopyText'
import ExpandableCard from '@common/components/ExpandableCard'
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

const SafeEip712Data: FC<Props> = ({ accountAddr, chainId, safeEip712Data }) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
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
  const setHasReachedBottom = useCallback(() => {}, [])
  const rows = useMemo<[string, string][]>(() => (data ? getSafeEip712HashRows(data) : []), [data])

  if (!messageToSign) return null

  return (
    <View style={isWeb ? spacings.mbLg : spacings.mb}>
      <ExpandableCard
        style={styles.container}
        contentStyle={styles.header}
        content={
          <Text
            fontSize={14}
            weight="semiBold"
            appearance="secondaryText"
            numberOfLines={1}
            style={styles.title}
          >
            {t('Safe hashes and JSON')}
          </Text>
        }
        expandedContent={
          <View style={styles.expandedContent}>
            <FallbackVisualization
              messageToSign={messageToSign}
              setHasReachedBottom={setHasReachedBottom}
              hasReachedBottom
              scrollEnabled={false}
              withCompactDataRow
              withDecimalIntegerRows
              containerStyle={styles.fallbackVisualization}
              separatorColor={theme.secondaryBackground}
            />
          </View>
        }
      >
        <View style={styles.rows}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text
                fontSize={12}
                weight="semiBold"
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
      </ExpandableCard>
    </View>
  )
}

export default React.memo(SafeEip712Data)
