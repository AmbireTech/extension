/* eslint-disable @typescript-eslint/no-require-imports */
const { fetchRelayerNetworks, RELAYER_NETWORKS_GLOBAL } = require('./relayerNetworks')

const RELAYER_URL = 'https://relayer.example.com'
const NETWORKS_URL = `${RELAYER_URL}/v2/config/networks`
const FETCH_TIMEOUT = 20000

const EXTENSION_CONFIG_NETWORKS = {
  '56': { chainId: 56, name: 'BNB Chain' },
  '100': { chainId: 100, name: 'Gnosis' }
}

const respondWith = (body: any, init: { ok?: boolean; status?: number } = {}) =>
  jest.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: '',
    json: async () => body
  })

let log: jest.SpyInstance
let warn: jest.SpyInstance
let error: jest.SpyInstance
// process.env is shared by every test file running in the same Jest worker
const envBeforeTests = { ...process.env }

beforeEach(() => {
  jest.useFakeTimers()
  process.env.RELAYER_URL = RELAYER_URL
  process.env.APP_ENV = 'development'
  log = jest.spyOn(console, 'log').mockImplementation(() => {})
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
  error = jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  process.env = { ...envBeforeTests }
})

describe('fetchRelayerNetworks', () => {
  it('requests the networks endpoint of the configured relayer', async () => {
    global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

    await fetchRelayerNetworks()

    expect(global.fetch).toHaveBeenCalledWith(NETWORKS_URL, expect.anything())
  })

  it('returns the networks of a successful response, keyed by chain id', async () => {
    global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

    await expect(fetchRelayerNetworks()).resolves.toEqual(EXTENSION_CONFIG_NETWORKS)
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
  })

  it('logs the endpoint it is about to call', async () => {
    global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

    await fetchRelayerNetworks()

    expect(log).toHaveBeenCalledWith(expect.stringContaining(`Fetching ${NETWORKS_URL}`))
  })

  it('logs how many networks it inlined and which chains they are', async () => {
    global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

    await fetchRelayerNetworks()

    expect(log).toHaveBeenCalledWith(expect.stringContaining('Inlining 2 networks'))
    expect(log).toHaveBeenCalledWith(expect.stringContaining('56, 100'))
  })

  it('clears the timeout once the relayer responds, so the build does not hang', async () => {
    global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

    await fetchRelayerNetworks()

    expect(jest.getTimerCount()).toBe(0)
  })

  it('aborts the request when the relayer does not respond in time', async () => {
    let abortSignal: AbortSignal | undefined
    global.fetch = jest.fn().mockImplementation((_url, options) => {
      abortSignal = options.signal
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(new Error('This operation was aborted'))
        )
      })
    })

    const networks = fetchRelayerNetworks()
    jest.advanceTimersByTime(FETCH_TIMEOUT)

    await expect(networks).resolves.toBeNull()
    expect(abortSignal!.aborted).toBe(true)
    expect(error).toHaveBeenCalledWith(expect.stringContaining('aborted'))
  })

  describe('on a development build', () => {
    it('logs the failing endpoint and falls back when the relayer responds with an error status', async () => {
      global.fetch = respondWith({}, { ok: false, status: 503 })

      await expect(fetchRelayerNetworks()).resolves.toBeNull()
      expect(error).toHaveBeenCalledWith(expect.stringContaining('503'))
      expect(error).toHaveBeenCalledWith(expect.stringContaining(NETWORKS_URL))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Falling back'))
    })

    it('logs and falls back when the response carries no networks', async () => {
      global.fetch = respondWith({ data: { extensionConfigNetworks: {} } })

      await expect(fetchRelayerNetworks()).resolves.toBeNull()
      expect(error).toHaveBeenCalledWith(expect.stringContaining('no networks'))
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('Falling back'))
    })

    it('logs and falls back when RELAYER_URL is not set, without naming a bogus url', async () => {
      delete process.env.RELAYER_URL
      global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

      await expect(fetchRelayerNetworks()).resolves.toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
      expect(error).toHaveBeenCalledWith(expect.stringContaining('RELAYER_URL is not set'))
      expect(error).not.toHaveBeenCalledWith(expect.stringContaining('undefined/v2'))
    })
  })

  describe('on a production build', () => {
    beforeEach(() => {
      process.env.APP_ENV = 'production'
    })

    it('throws when the relayer responds with an error status, so the deploy fails loudly', async () => {
      global.fetch = respondWith({}, { ok: false, status: 503 })

      await expect(fetchRelayerNetworks()).rejects.toThrow('503')
      expect(error).toHaveBeenCalledWith(expect.stringContaining('503'))
      expect(warn).not.toHaveBeenCalled()
    })

    it('throws when RELAYER_URL is not set', async () => {
      delete process.env.RELAYER_URL

      await expect(fetchRelayerNetworks()).rejects.toThrow('RELAYER_URL is not set')
    })

    it('still returns the networks of a successful response', async () => {
      global.fetch = respondWith({ data: { extensionConfigNetworks: EXTENSION_CONFIG_NETWORKS } })

      await expect(fetchRelayerNetworks()).resolves.toEqual(EXTENSION_CONFIG_NETWORKS)
    })
  })
})

describe('RELAYER_NETWORKS_GLOBAL', () => {
  it('matches the global declared for the app in src/benzin/constants/networks.ts', () => {
    const declaration = require('fs').readFileSync('src/benzin/constants/networks.ts', 'utf8')

    expect(declaration).toContain(`const ${RELAYER_NETWORKS_GLOBAL}:`)
  })
})
