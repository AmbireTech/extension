import { shouldShowWalletStaking } from './shouldShowWalletStaking'

describe('Wallet Staking Explore filters', () => {
  test.each([
    ['all networks and all categories', null, null, true],
    ['Ethereum and all categories', 1n, null, true],
    ['a non-Ethereum network and all categories', 137n, null, false],
    ['all networks and Services', null, 'Services', true],
    ['Ethereum and Staking', 1n, 'Staking', true],
    ['Ethereum and Staking Pool', 1n, 'Staking Pool', true],
    ['Ethereum and Yield', 1n, 'Yield', true],
    ['Ethereum and a category with different casing', 1n, 'staking', true],
    ['Ethereum and an unsupported category', 1n, 'DeFi', false],
    ['a non-Ethereum network and a supported category', 137n, 'Staking', false]
  ])('handles %s', (_description, networkChainId, category, expected) => {
    expect(shouldShowWalletStaking(networkChainId, category)).toBe(expected)
  })
})
