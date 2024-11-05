import React, { FC, useCallback, useState } from 'react'
import { View } from 'react-native'

import { PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import useTheme from '@common/hooks/useTheme'
import formatDecimals from '@common/utils/formatDecimals'

import DeFiPositionExpanded from './DeFiPositionExpanded'
import DeFiPositionHeader from './DeFiPositionHeader'
import getStyles from './styles'

const DeFiPosition: FC<PositionsByProvider> = ({
  providerName,
  positionInUSD,
  type,
  networkId,
  positions
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { styles, theme } = useTheme(getStyles)

  const positionInUSDFormatted = formatDecimals(positionInUSD, 'value')

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isExpanded ? theme.secondaryBackground : theme.primaryBackground
        }
      ]}
    >
      <DeFiPositionHeader
        providerName={providerName}
        networkId={networkId}
        toggleExpanded={toggleExpanded}
        isExpanded={isExpanded}
        positionInUSD={positionInUSDFormatted}
        healthRate={positions.length === 1 ? positions[0].additionalData.healthRate : undefined}
      />
      {isExpanded &&
        positions.map(({ id, assets, additionalData }) => (
          <DeFiPositionExpanded
            key={id}
            id={id}
            type={type}
            assets={assets}
            providerName={providerName}
            networkId={networkId}
            additionalData={additionalData}
            positionInUSD={positionInUSDFormatted}
          />
        ))}
    </View>
  )
}

export default React.memo(DeFiPosition)
