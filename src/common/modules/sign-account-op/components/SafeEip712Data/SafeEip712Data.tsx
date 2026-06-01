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

import { getSafeEip712DataValue } from './helpers'
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
  const rows = useMemo<[string, string][]>(
    () =>
      data
        ? [
            ['safeTxHash', data.safeTxHash],
            ['domainHash', data.domainHash],
            ['messageHash', data.messageHash]
          ]
        : [],
    [data]
  )

  if (!messageToSign) return null

  return (
    <View style={isWeb ? spacings.mbLg : spacings.mb}>
      <ExpandableCard
        style={styles.container}
        contentStyle={styles.content}
        content={
          <View style={styles.rows}>
            {rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text
                  fontSize={14}
                  weight="semiBold"
                  appearance="successText"
                  color={theme.secondaryAccent400}
                >
                  {t(label)}
                  {t(': ')}
                </Text>
                <Text
                  selectable
                  fontSize={14}
                  weight="medium"
                  appearance="primaryText"
                  style={styles.value}
                >
                  {value}
                </Text>
                <CopyText
                  text={value}
                  iconColor={theme.secondaryText}
                  iconSize={16}
                  shouldStopPropagation
                  style={spacings.mlMi}
                />
              </View>
            ))}
          </View>
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
            />
          </View>
        }
      />
    </View>
  )
}

export default React.memo(SafeEip712Data)
