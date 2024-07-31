import { bootstrapWithStorage, saParams } from '../functions.js'
import { checkBalanceInAccount, checkNetworks, checkCollectibleItem } from '../common/balance.js'

describe('sa_balance', () => {
  let browser
  let page
  let recorder
  beforeEach(async () => {
    ;({ browser, page, recorder } = await bootstrapWithStorage('sa_balance', saParams))
  })

  afterEach(async () => {
    await recorder.stop()
    // await browser.close()
  })

  it('check the balance in account ', async () => {
    await checkBalanceInAccount(page)
  })

  it('check if networks Ethereum, USDC and Polygon exist in the account  ', async () => {
    await checkNetworks(page)
  })

  it.skip('check if item exist in Collectibles tab', async () => {
    await checkCollectibleItem(page)
  })
})
