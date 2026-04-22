import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import {
  SelectedAccountPortfolio,
  SelectedAccountPortfolioTokenResult
} from '@ambire-common/interfaces/selectedAccount'
import { GasTankTokenResult } from '@ambire-common/libs/portfolio'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'

const parseGasTankToken = (token: GasTankTokenResult): SelectedAccountPortfolioTokenResult => {
  const { availableAmount, ...rest } = token

  return rest
}

export const getGasTankTokenDetails = (
  portfolio: SelectedAccountPortfolio,
  account: Account | null,
  networks: Network[]
) => {
  const gasTankResult = portfolio?.portfolioState?.gasTank?.result as
    | { gasTankTokens: GasTankTokenResult[] }
    | undefined

  const noAccount = !account || !account.addr
  const noPortfolio = !portfolio || !portfolio.portfolioState || !portfolio.portfolioState.gasTank
  const noGasTankResult = !gasTankResult || !('gasTankTokens' in gasTankResult)
  const noGasTankTokens =
    noGasTankResult ||
    !Array.isArray(gasTankResult.gasTankTokens) ||
    gasTankResult.gasTankTokens.length === 0

  if (noAccount || noPortfolio || noGasTankResult || noGasTankTokens) {
    return { token: null, balanceFormatted: null }
  }

  const token = gasTankResult.gasTankTokens[0]
    ? parseGasTankToken(gasTankResult.gasTankTokens[0])
    : null

  if (!token) {
    return { token: null, balanceFormatted: null }
  }

  const tokenDetails = getAndFormatTokenDetails(token, networks)

  return {
    token,
    balanceFormatted: tokenDetails.balanceFormatted,
    balanceUSDFormatted: tokenDetails.balanceUSDFormatted,
    balanceUSD: tokenDetails.balanceUSD
  }
}
