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

  it('enables Ambire analytics with Email Vault', () => {
    expect(getFeatureFlagUpdates('emailVault', true)).toEqual({
      emailVault: true,
      ambireAnalytics: true
    })
  })

  it('keeps Ambire analytics on when disabling Email Vault', () => {
    expect(getFeatureFlagUpdates('emailVault', false)).toEqual({ emailVault: false })
  })

  it('disables Email Vault with Ambire analytics', () => {
    expect(getFeatureFlagUpdates('ambireAnalytics', false)).toEqual({
      ambireAnalytics: false,
      emailVault: false
    })
  })

  it('enables only Ambire analytics', () => {
    expect(getFeatureFlagUpdates('ambireAnalytics', true)).toEqual({ ambireAnalytics: true })
  })
})
