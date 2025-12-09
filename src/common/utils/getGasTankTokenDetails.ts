import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import {
  SelectedAccountPortfolio,
  SelectedAccountPortfolioTokenResult
} from '@ambire-common/interfaces/selectedAccount'
import { GasTankTokenResult } from '@ambire-common/libs/portfolio'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'

const parseGasTankToken = (token: GasTankTokenResult, type: keyof GasTankTokenResult) => {
  const amount = token[type]
  const { availableAmount, ...rest } = token

  return { ...rest, amount } as SelectedAccountPortfolioTokenResult
}

export const getGasTankTokenDetails = (
  portfolio: SelectedAccountPortfolio,
  account: Account | null,
  networks: Network[],
  key: 'amount'
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

  const token = parseGasTankToken(gasTankResult.gasTankTokens[0], key)

  return {
    token,
    balanceFormatted: getAndFormatTokenDetails(token, networks).balanceFormatted,
    balanceUSDFormatted: getAndFormatTokenDetails(token, networks).balanceUSDFormatted
  }
}
