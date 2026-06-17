import React, { FC, useCallback, useState } from 'react'
import { View } from 'react-native'

import { PositionsByProvider } from '@ambire-common/libs/defiPositions/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

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
  const { styles, theme } = useTheme(getStyles)

  const positionInUSDFormatted = formatDecimals(positionInUSD, 'value')

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  return (
    <View
      style={[
        styles.container,
        isExpanded && {
          borderColor: theme.primaryBorder
        }
      ]}
    >
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
      {isExpanded && (
        <View style={spacings.mvMi}>
          {positions.map(({ id, assets, additionalData }) => (
            <DeFiPosition
              key={id}
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
      )}
    </View>
  )
}

export default React.memo(DeFiProviderPosition)
