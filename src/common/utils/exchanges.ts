import { ExchangeInfo, ExchangeInfoMap } from '@ambire-common/libs/portfolio/interfaces'

/**
 * Resolves the exchange ids attached to a token to the exchange info (name, logo, url)
 * fetched by the PortfolioController. Ids without a match are dropped, as there is
 * nothing to render for them.
 */
const getExchangesWithData = (
  exchangeIds: string[],
  exchangeData: ExchangeInfoMap | null
): ExchangeInfo[] => {
  if (!exchangeData) return []

  return exchangeIds
    .map((exchangeId) => exchangeData[exchangeId])
    .filter((exchange): exchange is ExchangeInfo => !!exchange)
}

export { getExchangesWithData }
