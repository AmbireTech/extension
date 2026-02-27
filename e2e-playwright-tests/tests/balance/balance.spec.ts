import { baParams, ledgerSaParams, saParams } from 'constants/env'
import tokens from 'constants/tokens'
import { test } from 'fixtures/pageObjects'
import Threshold from 'interfaces/threshold'

test.describe('Basic Account - Tokens balance check', { tag: '@balanceCheck' }, async () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(baParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('check balance of test tokens', async ({ pages }) => {
    const THRESHOLDS: Threshold[] = [
      ['gas-token', 1],
      [tokens.wallet.base, 1],
      // These tokens are used to pay fees in transactions, so we need more funds here:
      [tokens.usdc.base, 2],
      [tokens.usdc.optimism, 2],
      [tokens.eth.optimism, 0.000025]
    ]

    await pages.dashboard.checkBalances({
      accountName: 'Basic Account',
      thresholds: THRESHOLDS
    })
  })
})

test.describe('Smart Account - Tokens balance check', { tag: '@balanceCheck' }, async () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('check balance of test tokens', async ({ pages }) => {
    const THRESHOLDS: Threshold[] = [
      ['gas-token', 1],
      [tokens.wallet.base, 1],
      [tokens.dai.optimism, 1],
      // These tokens are used to pay fees in transactions, so we need more funds here:
      [tokens.usdc.base, 2],
      [tokens.usdc.optimism, 2]
    ]

    await pages.dashboard.checkBalances({
      accountName: 'Smart Account',
      thresholds: THRESHOLDS
    })
  })
})

test.describe('LEDGER Smart Account - Tokens balance check', { tag: '@balanceCheck' }, async () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(ledgerSaParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('check balance of test tokens', async ({ pages }) => {
    const THRESHOLDS: Threshold[] = [
      // These tokens are used to pay fees in transactions, so we need more funds here:
      [tokens.usdc.base, 1]
    ]

    await pages.dashboard.checkBalances({
      accountName: 'Ledger SA e2e tests',
      thresholds: THRESHOLDS
    })
  })
})
