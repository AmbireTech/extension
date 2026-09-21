import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { SupportedNetworks } from '@ambire-common/interfaces/network'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'

import type { TokenResult } from '@ambire-common/libs/portfolio'

export type FormattedTokenDetails = Partial<ReturnType<typeof getAndFormatTokenDetails>>

/**
 * Formats a token's balances on first read and returns the same result on every
 * read after that.
 *
 * Deferred rather than computed up front because formatting a token runs
 * `formatUnits` and a handful of `Intl.NumberFormat` passes, which is wasted on
 * the thousands of options a token Select is handed but never shows. Returns an
 * empty object when there is no token to format, which is what a token missing
 * from the portfolio has to read as.
 */
export const createFormattedTokenDetailsReader = (
  token: TokenResult | undefined,
  networks: SupportedNetworks[],
  simulatedAccountOp?: AccountOp
): (() => FormattedTokenDetails) => {
  let formatted: FormattedTokenDetails | null = null

  return () => {
    if (!formatted)
      formatted = token ? getAndFormatTokenDetails(token, networks, simulatedAccountOp) : {}

    return formatted
  }
}
