import React, { FC, useCallback, useState } from 'react'
import { View } from 'react-native'

import { PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import useTheme from '@common/hooks/useTheme'

import DeFiPosition from './DeFiPosition'
import DeFiPositionHeader from './DeFiPositionHeader'
import getStyles from './styles'

const DeFiProviderPosition: FC<PositionsByProvider> = ({
  providerName,
  positionInUSD,
  type,
  chainId,
  iconUrl,
  siteUrl,
  positions
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { styles } = useTheme(getStyles)

  const positionInUSDFormatted = formatDecimals(positionInUSD, 'value')

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <View style={[styles.container, !!isExpanded && styles.expandedContainer]}>
      <DeFiPositionHeader
        providerName={providerName}
        chainId={chainId}
        toggleExpanded={toggleExpanded}
        isExpanded={isExpanded}
        positionInUSD={positionInUSDFormatted}
        healthRate={
          positions.length === 1 && positions[0]
            ? positions[0].additionalData.healthRate
            : undefined
        }
        iconUrl={iconUrl}
        siteUrl={siteUrl}
      />
      {isExpanded &&
        positions.map(({ id, assets, additionalData }, index) => (
          <DeFiPosition
            key={id}
            withTopBorder={index !== 0 && positions.length > 1}
            id={id}
            type={type}
            assets={assets}
            providerName={providerName}
            chainId={chainId}
            additionalData={additionalData}
            siteUrl={siteUrl}
            positionInUSD={formatDecimals(additionalData.positionInUSD || 0, 'value')}
          />
        ))}
    </View>
  )
}

export default React.memo(DeFiProviderPosition)
