import { SelectedAccountPortfolioTokenResult } from '@ambire-common/interfaces/selectedAccount'

import getAndFormatTokenDetails from './getTokenDetails'

const ONE_ETH = 10n ** 18n

const getToken = (
  overrides: Partial<SelectedAccountPortfolioTokenResult>
): SelectedAccountPortfolioTokenResult => ({
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  chainId: 1n,
  amount: ONE_ETH,
  latestAmount: ONE_ETH,
  priceIn: [{ baseCurrency: 'usd', price: 2000 }],
  marketDataIn: [],
  flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: false, isFeeToken: false },
  ...overrides
})

describe('getAndFormatTokenDetails pending state', () => {
  it('shows the whole balance as leaving when what the account will hold is zero', () => {
    // A Privacy Pools account sending everything it has: its projected amount is 0n, which is falsy
    const details = getAndFormatTokenDetails(getToken({ amount: 0n, pendingAmount: 0n }))

    expect(details.isPending).toBe(true)
    expect(details.pendingToBeConfirmed).toBe(-ONE_ETH)
    expect(details.pendingBalance).toBe('0.0')
    expect(details.pendingToBeSigned).toBeUndefined()
  })

  it('shows no pending state when what the account will hold equals what the notes hold', () => {
    const details = getAndFormatTokenDetails(getToken({ pendingAmount: ONE_ETH }))

    expect(details.isPending).toBeUndefined()
    expect(details.pendingToBeConfirmed).toBeUndefined()
  })

  it('shows no pending state for a token with nothing on its way and nothing held', () => {
    const details = getAndFormatTokenDetails(
      getToken({ amount: 0n, latestAmount: 0n, pendingAmount: 0n })
    )

    expect(details.isPending).toBeUndefined()
  })
})
