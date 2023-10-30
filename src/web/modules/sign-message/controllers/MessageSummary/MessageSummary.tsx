import React from 'react'
import { View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { IrMessage } from '@ambire-common/libs/humanizer/interfaces'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'

import HumanizedVisualization from '../HumanizedVisualization'
import getStyles from './styles'

interface Props {
  message: IrMessage
  networkId?: NetworkDescriptor['id']
  explorerUrl?: NetworkDescriptor['explorerUrl']
  kind: IrMessage['content']['kind']
}

export function formatFloatTokenAmount(
  amount: any,
  useGrouping = true,
  maximumFractionDigits = 18
) {
  if (
    Number.isNaN(amount) ||
    Number.isNaN(parseFloat(amount)) ||
    !(typeof amount === 'number' || typeof amount === 'string')
  )
    return amount

  try {
    const minimumFractionDigits = Math.min(2, maximumFractionDigits || 0)
    return (typeof amount === 'number' ? amount : parseFloat(amount)).toLocaleString(undefined, {
      useGrouping,
      maximumFractionDigits: Math.max(minimumFractionDigits, maximumFractionDigits),
      minimumFractionDigits
    })
  } catch (err) {
    console.error(err)
    return amount
  }
}

const MessageSummary = ({ message, networkId, explorerUrl, kind }: Props) => {
  const { styles } = useTheme(getStyles)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HumanizedVisualization
          data={message.fullVisualization}
          networkId={networkId}
          explorerUrl={explorerUrl}
          kind={kind}
        />
      </View>
      <ScrollView contentContainerStyle={styles.rawMessage}>
        <Text
          appearance="secondaryText"
          fontSize={14}
          weight="regular"
          style={styles.rawMessageTitle}
        >
          Raw message:
        </Text>
        <Text appearance="secondaryText" fontSize={14} weight="regular">
          {JSON.stringify(message.content, null, 4)}
        </Text>
      </ScrollView>
    </View>
  )
}

export default React.memo(MessageSummary)
