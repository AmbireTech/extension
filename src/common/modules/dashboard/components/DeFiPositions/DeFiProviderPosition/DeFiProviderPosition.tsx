import React, { FC, useCallback, useState } from 'react'
import { View } from 'react-native'

import { SelectedAccountPositionsByProvider } from '@ambire-common/interfaces/selectedAccount'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import DeFiPosition from './DeFiPosition'
import DeFiPositionHeader from './DeFiPositionHeader'
import getStyles from './styles'

const DeFiProviderPosition: FC<SelectedAccountPositionsByProvider> = ({
  providerName,
  balanceInUSD,
  type,
  chainId,
  iconUrl,
  siteUrl,
  positions
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { styles, theme } = useTheme(getStyles)

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
        formattedBalance={formatDecimals(balanceInUSD, 'value')}
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
          {positions.map(({ id, assets, additionalData, balanceInUSD: positionBalanceInUSD }) => (
            <DeFiPosition
              key={id}
              id={id}
              type={type}
              assets={assets}
              providerName={providerName}
              chainId={chainId}
              additionalData={additionalData}
              siteUrl={siteUrl}
              formattedBalance={formatDecimals(positionBalanceInUSD, 'value')}
            />
          ))}
        </View>
      )}
    </View>
  )
}

export default React.memo(DeFiProviderPosition)
