/* eslint-disable import/no-unresolved */
import { networks } from '@ambire-common/consts/networks'
import { getBackgroundRequestsByType, monitorRequests } from '../common/requests.js'
import { makeSwap, makeValidTransaction } from '../common/transactions.js'
import { baParams } from '../config/constants'
import { bootstrapWithStorage } from '../common-helpers/bootstrapWithStorage'
import { clickOnElement } from '../common-helpers/clickOnElement'

describe('Monitor network requests and make sure only necessary requests are made', () => {
  let browser
  let page
  let recorder
  let serviceWorker
  let extensionURL

  beforeEach(async () => {
    ;({ browser, page, recorder, extensionURL, serviceWorker } = await bootstrapWithStorage(
      'monitor_requests',
      baParams
    ))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  it('portfolio and account state reload', async () => {
    const httpRequests = await monitorRequests(serviceWorker.client, async () => {
      await clickOnElement(page, '[data-testid="refresh-button"]')
    })

    const {
      nativeTokenPriceRequests,
      batchedErc20TokenPriceRequests,
      hintsRequests,
      rpcRequests,
      uncategorizedRequests
    } = getBackgroundRequestsByType(httpRequests)

    // Expect no requests for prices. Portfolio should cache prices
    expect(nativeTokenPriceRequests.length).toBe(0)
    expect(batchedErc20TokenPriceRequests.length).toBe(0)

    expect(hintsRequests.length).toBe(networks.length)

    expect(rpcRequests.length).toBeLessThanOrEqual(20)
    expect(uncategorizedRequests.length).toBe(0)
  })

  it('sign account op request created through transfer', async () => {
    const httpRequests = await monitorRequests(serviceWorker.client, async () => {
      await makeValidTransaction(page, extensionURL, browser, {
        shouldStopBeforeSign: true
      })
    })

    const {
      rpcRequests,
      nativeTokenPriceRequests,
      batchedErc20TokenPriceRequests,
      uncategorizedRequests
    } = getBackgroundRequestsByType(httpRequests)

    const nonPolygonAndEthereumRpcRequests = rpcRequests.filter(
      (request) => !request.includes('polygon') && !request.includes('ethereum')
    )

    // Expect more rpc requests because of ENS/UD resolution
    // @TODO: check if we can reduce the number of requests
    expect(rpcRequests.length).toBeLessThanOrEqual(10)
    expect(nonPolygonAndEthereumRpcRequests.length).toBe(0)
    expect(nativeTokenPriceRequests.length).toBeLessThanOrEqual(2)
    expect(batchedErc20TokenPriceRequests.length).toBeLessThanOrEqual(2)
    expect(uncategorizedRequests.length).toBe(0)
  })

  describe('Swap', () => {
    // Swap tests fail occasionally (2 out of 10 times in CI) because Uniswap can't switch the network to Polygon.
    // We traced the RPC requests but couldn't identify any failing ones.
    // Since the swap is managed by Uniswap, it is difficult to debug exactly what is happening.
    // Considering that this failure is only observed in CI mode,
    // we have decided to stop investigating the issue and instead re-run the test if it fails.
    jest.retryTimes(3)

    it('sign account op request created through swap', async () => {
      const httpRequests = await monitorRequests(serviceWorker.client, async () => {
        await makeSwap(page, extensionURL, browser, {
          shouldStopBeforeSign: true
        })
      })

      const {
        nativeTokenPriceRequests,
        batchedErc20TokenPriceRequests,
        hintsRequests,
        rpcRequests,
        uncategorizedRequests
      } = getBackgroundRequestsByType(httpRequests)

      expect(nativeTokenPriceRequests.length).toBeLessThanOrEqual(2)
      expect(batchedErc20TokenPriceRequests.length).toBeLessThanOrEqual(2)
      expect(hintsRequests.length).toBe(1)
      // TODO: figure out why we have so many rpc requests
      expect(rpcRequests.length).toBeLessThanOrEqual(15)
      expect(uncategorizedRequests.length).toBe(0)
    })
  })
})
