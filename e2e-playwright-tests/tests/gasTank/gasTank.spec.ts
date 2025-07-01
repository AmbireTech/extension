import { baParams } from 'constants/env'

import { expect } from '@playwright/test'

import tokens from '../../constants/tokens'
import { test } from '../../fixtures/pageObjects'

test.describe('gasTank - Basic Account', () => {
  test.beforeEach(async ({ gasTankPage }) => {
    await gasTankPage.init(baParams)
  })

  test('top up Gas Tank with 0.05$ on Base', async ({ gasTankPage }) => {
    const sendToken = tokens.usdc.base
    // get initial balance
    const oldBalance = await gasTankPage.getCurrentBalance()
    // top up gas tank
    await gasTankPage.topUpGasTank(sendToken, '0.05')

    // takes time for new balance to appear
    const newBalance = await gasTankPage.refreshUntilNewBalanceIsVisible(oldBalance)

    expect(oldBalance).toBeLessThan(newBalance)
  })
})
