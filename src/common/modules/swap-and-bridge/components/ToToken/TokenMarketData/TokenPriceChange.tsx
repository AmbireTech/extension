import React, { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import useTokenMarketData from './useTokenMarketData'

// Movements this small read as noise rather than as a trend, so they are not worth showing
const MIN_CHANGE_TO_DISPLAY = 0.1

type Props = {
  chainId: number
  address: string
}

const TokenPriceChange: FC<Props> = ({ chainId, address }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const marketData = useTokenMarketData(chainId, address)
  const change24h = marketData?.change24h

  // Covers being opted out of the feature, as well as not having the data yet
  if (marketData?.status !== 'DONE' || typeof change24h !== 'number') return null
  if (Math.abs(change24h) < MIN_CHANGE_TO_DISPLAY) return null

  const isNegative = change24h < 0

  return (
    <Text
      fontSize={14}
      weight="medium"
      color={isNegative ? theme.errorText : theme.successText}
      style={spacings.mlSm}
      dataSet={createGlobalTooltipDataSet({
        id: `token-${chainId}-${address}-price-change`,
        content: t('24 hour price change')
      })}
    >
      {`${isNegative ? '-' : '+'}${Math.abs(change24h).toFixed(1)}%`}
    </Text>
  )
}

export default memo(TokenPriceChange)
