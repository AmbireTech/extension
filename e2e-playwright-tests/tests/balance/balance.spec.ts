import { baParams, saParams } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import Threshold from 'interfaces/threshold'

test.describe('Basic Account - Tokens balance check', { tag: '@balanceCheck' }, async () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(baParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('check balance of test tokens', async ({ pages }) => {
    const THRESHOLDS: Threshold[] = [
      ['gas-token', 1],
      [tokens.wallet.base, 300],
      [tokens.usdc.optimism, 2],
      [tokens.xwallet.ethereum, 2]
    ]

    const err = await pages.dashboard.checkBalances({
      accountName: 'Basic account',
      thresholds: THRESHOLDS
    })

    if (err) throw new Error(err)

    console.log('✅ Basic Account tokens and gas tank have sufficient balance.')
  })
})

test.describe('Smart Account - Tokens balance check', { tag: '@balanceCheck' }, async () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('check balance of test tokens', async ({ pages }) => {
    const THRESHOLDS: Threshold[] = [
      ['gas-token', 1],
      [tokens.wallet.base, 300],
      [tokens.usdc.base, 3],
      [tokens.usdc.optimism, 2],
      [tokens.usdce.optimism, 2],
      [tokens.dai.optimism, 2],
      [tokens.xwallet.ethereum, 2]
    ]

    const err = await pages.dashboard.checkBalances({
      accountName: 'Smart Account',
      thresholds: THRESHOLDS
    })

    if (err) throw new Error(err)

    console.log('✅ Smart Account tokens and gas tank have sufficient balance.')
  })
})
