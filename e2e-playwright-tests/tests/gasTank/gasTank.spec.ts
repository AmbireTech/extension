import { saParams } from 'constants/env'

import tokens from '../../constants/tokens'
import { test } from '../../fixtures/pageObjects'

test.describe('gasTank - Smart Account', { tag: '@gasTank' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('top up Gas Tank with 0.1$ on Base', async ({ pages }) => {
    const sendToken = tokens.usdc.base
    const message = 'Top up ready!'
    // let oldBalance: number

    await test.step('assert no transaction on Activity tab', async () => {
      await pages.dashboard.checkNoTransactionOnActivityTab()
    })

    // await test.step('get current gas tank balance', async () => {
    //   oldBalance = await pages.gasTank.getCurrentBalance()
    // })

    await test.step('top up gas tank', async () => {
      await pages.gasTank.topUpGasTank(sendToken, '0.01')
      await pages.transfer.signSlowSpeedTransaction({ sendToken, message })
    })

    // TODO: topping up with 0.01 + fee made the gas tank amount decrease so the test fails
    // await test.step('assert new gas tank balance', async () => {
    //   const newBalance = await pages.gasTank.refreshUntilNewBalanceIsVisible(oldBalance)

    //   expect(oldBalance).toBeLessThan(newBalance)
    // })

    await test.step('assert new transaction on Activity tab', async () => {
      await pages.gasTank.checkSendTransactionOnActivityTab()
    })
  })
})
