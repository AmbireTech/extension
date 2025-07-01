import { saParams } from 'constants/env'
import { test } from 'fixtures/pageObjects'

test.describe('dashboard', () => {
  test.beforeEach(async ({ dashboardPage }) => {
    await dashboardPage.init(saParams)
  })

  test('should have balance on the dashboard', async ({ dashboardPage }) => {
    await dashboardPage.checkBalanceInAccount()
  })

  test('should test if expected tokens are visible on the dashboard', async ({ dashboardPage }) => {
    await dashboardPage.checkIfTokensExist()
  })

  test('should test if expected NFTs are visible on the dashboard', async ({ dashboardPage }) => {
    await dashboardPage.checkCollectibleItem()
  })
})
