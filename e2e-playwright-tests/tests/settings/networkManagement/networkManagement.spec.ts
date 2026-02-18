import { saParams } from 'constants/env'
import { test } from '../../../fixtures/pageObjects'
import { runAddManualNetworkFlow, runChainlistFlow } from '../../../flows/networkManagementFlow'

test.describe('network management', { tag: '@networkManagement' }, () => {
  test.beforeEach(async ({ pages }) => {
    await pages.initWithStorage(saParams)
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('adding network manually', async ({ pages }) => {
    await runAddManualNetworkFlow({ pages })
  })

  test('add, edit and disable network from Chainlist', async ({ pages }) => {
    await runChainlistFlow({ pages })
  })
})
