import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'

interface Props {
  tooltipId: string
  message: string
}

const NotSupportedNetworkTooltip: React.FC<Props> = ({ tooltipId, message }) => {
  return (
    <Tooltip id={tooltipId}>
      <View>
        <Text fontSize={14} appearance="secondaryText">
          {message}
        </Text>
      </View>
    </Tooltip>
  )
}

export default React.memo(NotSupportedNetworkTooltip)
