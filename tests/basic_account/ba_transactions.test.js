import { bootstrapWithStorage, baParams } from '../functions.js'

import {
  makeValidTransaction,
  makeSwap,
  sendFundsGreaterThanBalance,
  sendFundsToSmartContract,
  signMessage
} from '../common/transactions.js'

describe('ba_transactions', () => {
  let browser, page, extensionRootUrl, recorder

  beforeEach(async () => {
    ;({ browser, page, recorder, extensionRootUrl } = await bootstrapWithStorage(
      'ba_transactions',
      baParams
    ))
  })

  afterEach(async () => {
    if (recorder) await recorder.stop()
    if (browser) await browser.close()
  })

  it('Makes a valid transaction', async () => {
    await makeValidTransaction(page, extensionRootUrl, browser)
  })

  it('Makes a valid swap', async () => {
    await makeSwap(page, extensionRootUrl, browser)
  })

  it('(-) Sends MATIC tokens greater than the available balance', async () => {
    await sendFundsGreaterThanBalance(page, extensionRootUrl)
  })

  it('(-) Sends MATIC tokens to a smart contract', async () => {
    await sendFundsToSmartContract(page, extensionRootUrl)
  })

  it('Signs a message', async () => {
    await signMessage(page, extensionRootUrl, browser, process.env.BA_SELECTED_ACCOUNT)
  })
})
