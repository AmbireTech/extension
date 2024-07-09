import { bootstrapWithStorage, baParams } from '../functions.js'

import {
  makeValidTransaction,
  makeSwap,
  sendFundsGreaterThanBalance,
  sendFundsToSmartContract,
  signMessage
} from '../common/transactions.js'

describe('ba_transactions', () => {
  let browser
  let page
  let extensionURL
  let recorder

  beforeEach(async () => {
    ;({ browser, page, recorder, extensionURL } = await bootstrapWithStorage(
      'ba_transactions',
      baParams
    ))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  it('Makes a valid transaction', async () => {
    await makeValidTransaction(page, extensionURL, browser)
  })

  // skip the test because Uniswap is temp broken on Polygon
  it.skip('Makes a valid swap', async () => {
    await makeSwap(page, extensionURL, browser)
  })

  it('(-) Sends MATIC tokens greater than the available balance', async () => {
    await sendFundsGreaterThanBalance(page, extensionURL)
  })

  it('(-) Sends MATIC tokens to a smart contract', async () => {
    await sendFundsToSmartContract(page, extensionURL)
  })

  it('Signs a message', async () => {
    await signMessage(page, extensionURL, browser, process.env.BA_SELECTED_ACCOUNT)
  })
})
