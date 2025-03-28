export const mockPortfolioResponse = async (client, mockResponse) => {
  let isMocked = false

  await client.send('Fetch.enable', {
    patterns: [{ urlPattern: '*', requestStage: 'Response' }]
  })

  client.on('Fetch.requestPaused', async (event) => {
    try {
      if (!isMocked && event.request.url.includes('portfolio-additional')) {
        await client.send('Fetch.fulfillRequest', {
          requestId: event.requestId,
          responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: 'application/json' }],
          body: Buffer.from(JSON.stringify(mockResponse)).toString('base64')
        })
        isMocked = true
      } else {
        await client.send('Fetch.continueRequest', { requestId: event.requestId })
      }
    } catch (error) {
      console.error('Error handling request:', error)
    }
  })
}
