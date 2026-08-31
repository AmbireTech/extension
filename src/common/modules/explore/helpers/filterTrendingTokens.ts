import { TrendingToken } from '@ambire-common/interfaces/dapp'

/**
 * Case-insensitive substring match on symbol or name. Substring (not fuzzy) is intentional here:
 * token symbols are short tickers (e.g. "BTC") where fuzzy matching produces noisy results.
 */
export const filterTrendingTokensBySearch = (
  tokens: TrendingToken[],
  search: string
): TrendingToken[] => {
  const query = search.trim().toLowerCase()
  if (!query) return []

  return tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(query) || token.name.toLowerCase().includes(query)
  )
}
