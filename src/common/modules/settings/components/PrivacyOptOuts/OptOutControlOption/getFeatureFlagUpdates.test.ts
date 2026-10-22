import getFeatureFlagUpdates from './getFeatureFlagUpdates'

describe('getFeatureFlagUpdates', () => {
  it('enables all settings required by Gas Tank', () => {
    expect(getFeatureFlagUpdates('gasTank', true)).toEqual({
      gasTank: true,
      erc4337: true,
      tokenPrices: true
    })
  })

  it('enables Token prices with ERC-4337', () => {
    expect(getFeatureFlagUpdates('erc4337', true)).toEqual({
      erc4337: true,
      tokenPrices: true
    })
  })

  it('disables Gas Tank with ERC-4337', () => {
    expect(getFeatureFlagUpdates('erc4337', false)).toEqual({
      erc4337: false,
      gasTank: false
    })
  })

  it('disables ERC-4337 and Gas Tank with Token prices', () => {
    expect(getFeatureFlagUpdates('tokenPrices', false)).toEqual({
      tokenPrices: false,
      erc4337: false,
      gasTank: false
    })
  })
})
