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

describe('getAndFormatTokenDetails pending delivery', () => {
  it('adds the amount of an in-progress swap or bridge to the balance', () => {
    const details = getAndFormatTokenDetails(
      getToken({ pendingAmount: ONE_ETH }),
      undefined,
      undefined,
      { pendingDelivery: ONE_ETH / 2n }
    )

    expect(details.isPending).toBe(true)
    expect(details.pendingDelivery).toBe(ONE_ETH / 2n)
    expect(details.pendingDeliveryFormatted).toBeDefined()
    expect(details.pendingBalance).toBe('1.5')
    expect(details.pendingToBeConfirmed).toBeUndefined()
    expect(details.pendingToBeSigned).toBeUndefined()
  })

  it('shows the delivery for a token that has no latest and pending block amounts', () => {
    const details = getAndFormatTokenDetails(
      getToken({ latestAmount: undefined, pendingAmount: undefined }),
      undefined,
      undefined,
      { pendingDelivery: ONE_ETH }
    )

    expect(details.isPending).toBe(true)
    expect(details.pendingBalance).toBe('2.0')
    expect(details.pendingToBeConfirmed).toBeUndefined()
  })

  it('shows no pending state when nothing is on its way', () => {
    const details = getAndFormatTokenDetails(
      getToken({ latestAmount: undefined, pendingAmount: undefined }),
      undefined,
      undefined,
      { pendingDelivery: 0n }
    )

    expect(details.isPending).toBeUndefined()
    expect(details.pendingDelivery).toBeUndefined()
  })

  it("reads the delivery from the token's pendingDeliveryAmount when none is passed", () => {
    const details = getAndFormatTokenDetails(
      getToken({ pendingAmount: ONE_ETH, pendingDeliveryAmount: ONE_ETH })
    )

    expect(details.pendingDelivery).toBe(ONE_ETH)
    expect(details.pendingBalance).toBe('2.0')
  })
})
