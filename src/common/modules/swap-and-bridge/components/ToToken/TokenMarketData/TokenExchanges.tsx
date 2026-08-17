import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import HelpIcon from '@common/assets/svg/HelpIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import ManifestImage from '@common/components/ManifestImage'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getExchangesWithData } from '@common/utils/exchanges'

import useTokenMarketData from './useTokenMarketData'

const LOGO_SIZE = 16
// Each logo is pulled onto the previous one, so that they read as a single stack
const LOGO_OVERLAP = 5
// Beyond this the logos start squeezing out the token name, so the rest are counted instead
const MAX_LOGOS_TO_DISPLAY = 5
// Tokens traded on dozens of exchanges would otherwise produce an unreadable tooltip
const MAX_EXCHANGES_IN_TOOLTIP = 10

type Props = {
  chainId: number
  address: string
}

const TokenExchanges: FC<Props> = ({ chainId, address }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const marketData = useTokenMarketData(chainId, address)
  const { state: exchangeData } = useController(
    'PortfolioController',
    (state) => state.exchangeState.exchanges
  )

  const exchangesWithData = useMemo(
    () => getExchangesWithData(marketData?.exchanges || [], exchangeData),
    [marketData?.exchanges, exchangeData]
  )

  // Shown in place of a logo that failed to load, instead of leaving an empty circle
  const renderFallbackIcon = useCallback(
    () => <HelpIcon width={LOGO_SIZE - 6} height={LOGO_SIZE - 6} color={theme.secondaryText} />,
    [theme.secondaryText]
  )

  // Opted out of the feature
  if (!marketData) return null

  if (marketData.status === 'LOADING')
    return <Spinner style={{ width: LOGO_SIZE, height: LOGO_SIZE }} />

  // Nothing to show for a failed fetch, the controller retries it shortly
  if (marketData.status === 'FAIL') return null

  if (marketData.status === 'NOT_FOUND')
    return (
      <View
        dataSet={createGlobalTooltipDataSet({
          id: `token-${chainId}-${address}-exchanges-unknown`,
          content: t("We don't have information about where this token is traded.")
        })}
        style={spacings.mlTy}
      >
        <HelpIcon width={LOGO_SIZE} height={LOGO_SIZE} color={theme.secondaryText} />
      </View>
    )

  if (!exchangesWithData.length) return null

  const exchangesToDisplay = exchangesWithData.slice(0, MAX_LOGOS_TO_DISPLAY)
  const hiddenExchangesCount = exchangesWithData.length - exchangesToDisplay.length

  const namesInTooltip = exchangesWithData
    .slice(0, MAX_EXCHANGES_IN_TOOLTIP)
    .map(({ name }) => name)
    .join(', ')
  const tooltipContent =
    exchangesWithData.length > MAX_EXCHANGES_IN_TOOLTIP ? `${namesInTooltip}...` : namesInTooltip

  return (
    <View
      style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}
      dataSet={createGlobalTooltipDataSet({
        id: `token-${chainId}-${address}-exchanges`,
        // Names the exchanges beyond the displayed logos too, up to a readable limit
        content: t('Traded on {{exchanges}}', { exchanges: tooltipContent })
      })}
    >
      {exchangesToDisplay.map((exchange, index) => (
        <View
          key={exchange.id}
          accessibilityLabel={exchange.name}
          style={{
            ...flexbox.center,
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: LOGO_SIZE / 2,
            backgroundColor: theme.primaryBackground,
            marginLeft: index === 0 ? 0 : -LOGO_OVERLAP,
            // Keeps the leftmost logos on top of the ones that follow them
            zIndex: exchangesToDisplay.length - index
          }}
        >
          <ManifestImage
            uri={exchange.image}
            size={LOGO_SIZE - 2}
            isRound
            fallback={renderFallbackIcon}
            containerStyle={{ backgroundColor: 'transparent' }}
          />
        </View>
      ))}
      {!!hiddenExchangesCount && (
        <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mlMi}>
          {`+${hiddenExchangesCount}`}
        </Text>
      )}
    </View>
  )
}

export default memo(TokenExchanges)
