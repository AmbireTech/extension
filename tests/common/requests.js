// eslint-disable-next-line import/no-unresolved
import wait from '@ambire-common/utils/wait'

function getBackgroundRequestsByType(requests) {
  const nativeTokenPriceRequests = []
  const batchedErc20TokenPriceRequests = []
  const hintsRequests = []
  const rpcRequests = []
  const uncategorizedRequests = []

  requests.forEach((request) => {
    if (request.includes('/simple/price')) {
      nativeTokenPriceRequests.push(request)
      return
    }
    if (request.includes('/simple/token_price')) {
      batchedErc20TokenPriceRequests.push(request)
      return
    }
    if (request.includes('invictus')) {
      rpcRequests.push(request)
      return
    }
    if (request.includes('/multi-hints')) {
      hintsRequests.push(request)
      return
    }
    uncategorizedRequests.push(request)
  })

  return {
    nativeTokenPriceRequests,
    batchedErc20TokenPriceRequests,
    hintsRequests,
    rpcRequests,
    uncategorizedRequests
  }
}

async function monitorRequests(
  client,
  requestInducingFunction,
  { maxTimeBetweenRequests = 2000, throttleRequestsByMs = 0, blockRequests = [] } = {}
) {
  const httpRequests = []
  let lastRequestTime = null

  // Disable cache
  await client.send('Network.setCacheDisabled', { cacheDisabled: true })
  // Enable Fetch domain for request interception
  await client.send('Fetch.enable', {
    patterns: [{ urlPattern: '*', requestStage: 'Request' }]
  })

  const onRequestPaused = async ({ requestId, request }) => {
    httpRequests.push(request.url)
    // Synchronize updates to lastRequestTime to avoid race conditions
    lastRequestTime = Date.now()

    if (blockRequests.some((blockRequest) => request.url.includes(blockRequest))) {
      await client.send('Fetch.failRequest', { requestId, errorReason: 'Aborted' })
      return
    }

    if (throttleRequestsByMs) {
      await wait(throttleRequestsByMs)
    }

    await client.send('Fetch.continueRequest', { requestId })
  }

  // Start listening to the request events
  client.on('Fetch.requestPaused', onRequestPaused)

  try {
    // Trigger the function that induces requests
    await requestInducingFunction()

    // Poll until no more requests are detected within the specified time frame
    while (
      !lastRequestTime ||
      Date.now() - lastRequestTime < maxTimeBetweenRequests + throttleRequestsByMs
    ) {
      await wait(maxTimeBetweenRequests) // Polling interval
    }
  } finally {
    // Ensure cleanup happens in case of error
    client.off('Fetch.requestPaused', onRequestPaused)
  }

  return httpRequests
}

export { monitorRequests, getBackgroundRequestsByType }
