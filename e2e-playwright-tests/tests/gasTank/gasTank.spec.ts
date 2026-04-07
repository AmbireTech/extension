import { saParams } from 'constants/env'

import tokens from '../../constants/tokens'
import { test } from '../../fixtures/pageObjects'

test.describe('gasTank - Smart Account', { tag: '@gasTank' }, () => {
  test.setTimeout(80000)

  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('top up Gas Tank with 0.1$ on Base', async ({ pages }) => {
    const sendToken = tokens.usdc.base
    const message = 'Top up ready!'

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    await test.step('top up gas tank', async () => {
      await pages.gasTank.topUpGasTank(sendToken, '0.01')
      await pages.transfer.signSlowSpeedTransaction({ sendToken, message })
    })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.gasTank.checkSendTransactionOnActivityTab()
    })
  })
})
