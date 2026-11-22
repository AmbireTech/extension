import { TokenResult } from '@ambire-common/libs/portfolio'

import { createFormattedTokenDetailsReader } from './formattedTokenDetails'

const ONE_ETH = 10n ** 18n

const TOKEN: TokenResult = {
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  address: '0x0000000000000000000000000000000000000000',
  chainId: 1n,
  amount: ONE_ETH,
  priceIn: [{ baseCurrency: 'usd', price: 2000 }],
  marketDataIn: [],
  flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: false, isFeeToken: false }
}

describe('createFormattedTokenDetailsReader', () => {
  it('adds what in-progress swaps and bridges will deliver to the balance', () => {
    const details = createFormattedTokenDetailsReader(
      { ...TOKEN, pendingDeliveryAmount: ONE_ETH },
      []
    )()

    expect(details.isPending).toBe(true)
    expect(details.pendingDelivery).toBe(ONE_ETH)
    expect(details.pendingBalance).toBe('2.0')
  })

  it('shows no pending state without a delivery', () => {
    const details = createFormattedTokenDetailsReader(TOKEN, [])()

    expect(details.isPending).toBeUndefined()
    expect(details.pendingDelivery).toBeUndefined()
  })

  it('formats nothing for a token missing from the portfolio', () => {
    expect(createFormattedTokenDetailsReader(undefined, [])()).toEqual({})
  })
})
