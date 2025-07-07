import { saParams } from 'constants/env'

import { test } from '../../fixtures/pageObjects'

test.describe('network management', () => {
  test.beforeEach(async ({ settingsPage }) => {
    await settingsPage.init(saParams)
  })

  test('adding network manually', async ({ settingsPage }) => {
    await settingsPage.addNetworkManually('FLR')
  })

  test('add, edit and disable network from Chainlist', async ({ settingsPage }) => {
    await settingsPage.addNetworkFromChainlist('FLOW')
    await settingsPage.editNetwork('FLOW')
    await settingsPage.disableNetwork()
  })
})
