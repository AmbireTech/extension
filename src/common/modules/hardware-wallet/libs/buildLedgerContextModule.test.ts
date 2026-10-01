import { buildLedgerContextModule } from './buildLedgerContextModule'

const noopLogger = () => ({
  subscribers: [],
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
})

const reportParams = {
  signatureId: 'test',
  signingMethod: 'eth_signTransaction',
  isBlindSign: true,
  chainId: 1,
  targetAddress: '0x0000000000000000000000000000000000000001',
  blindSignReason: 'no_clear_signing_context',
  modelId: 'stax',
  signerAppVersion: '1.0.0',
  deviceVersion: null,
  ethContext: null
} as any

describe('buildLedgerContextModule', () => {
  const originalFetch = global.fetch
  const fetchMock = jest.fn()

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }))
    global.fetch = fetchMock
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('sends signing reports to Ledger only while the user allows it, checked on every report', async () => {
    let isAllowed = false
    const contextModule = buildLedgerContextModule({
      loggerFactory: noopLogger,
      isSigningReportAllowed: () => isAllowed
    })

    await contextModule.report(reportParams)
    expect(fetchMock).not.toHaveBeenCalled()

    isAllowed = true
    await contextModule.report(reportParams)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0][0])).toContain('blind-signing-events')

    isAllowed = false
    await contextModule.report(reportParams)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
