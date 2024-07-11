import React from 'react'
import { ScrollView } from 'react-native'

import { Network, NetworkId } from '@ambire-common/interfaces/network'
import { IrMessage } from '@ambire-common/libs/humanizer/interfaces'
import ExpandableCard from '@common/components/ExpandableCard'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'

import HumanizedVisualization from '../../../../../common/components/HumanizedVisualization'
import getStyles from './styles'

interface Props {
  message: IrMessage
  networkId?: NetworkId
  kind: IrMessage['content']['kind']
  networks: Network[]
}

const MessageSummary = ({ message, networkId, kind, networks }: Props) => {
  const { styles } = useTheme(getStyles)
  const isTypedMessage = kind === 'typedMessage'

  return (
    <ExpandableCard
      enableExpand={isTypedMessage}
      hasArrow={isTypedMessage}
      content={
        <HumanizedVisualization
          data={message.fullVisualization}
          networkId={networkId || 'ethereum'}
          networks={networks}
        />
      }
      expandedContent={
        <ScrollView contentContainerStyle={styles.rawMessage}>
          <Text
            appearance="secondaryText"
            fontSize={14}
            weight="regular"
            style={styles.rawMessageTitle}
          >
            Raw message:
          </Text>
          <Text selectable appearance="secondaryText" fontSize={14} weight="regular">
            {JSON.stringify(message.content, null, 4)}
          </Text>
        </ScrollView>
      }
    />
  )
}

export default React.memo(MessageSummary)
