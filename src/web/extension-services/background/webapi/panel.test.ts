let mockEngine: 'webkit' | 'gecko' = 'webkit'
const mockStorageLocalGet = jest.fn(async (): Promise<Record<string, unknown>> => ({}))
const mockScheduleDappTabFocusDispatch = jest.fn()

jest.mock('@web/constants/browserapi', () => ({
  get engine() {
    return mockEngine
  },
  browser: { storage: { local: { get: () => mockStorageLocalGet() } } }
}))
jest.mock('@web/extension-services/background/CrashAnalytics', () => ({
  captureBackgroundException: jest.fn()
}))
jest.mock('@web/extension-services/background/handlers/dispatchDappTabFocus', () => ({
  scheduleDappTabFocusDispatch: (...args: unknown[]) => mockScheduleDappTabFocusDispatch(...args)
}))
jest.mock('@web/extension-services/messengers', () => ({}))
jest.mock('@web/utils/sidePanel', () => ({
  FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY: 'isFirefoxSidebarOnLeft',
  getChromeSidePanelApi: () => undefined,
  getFirefoxSidebarApi: () => undefined
}))

type PanelModule = typeof import('./panel')

const APP_WINDOW_ID = 2
const OTHER_WINDOW_ID = 3

const makePm = (ports: { id: string; name: string }[]) => ({ ports }) as any

const loadPanel = (engine: 'webkit' | 'gecko'): PanelModule => {
  mockEngine = engine
  let panel: PanelModule | undefined
  jest.isolateModules(() => {
    // A fresh module per engine, as panel.ts reads the engine when it loads
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    panel = require('./panel')
  })

  return panel!
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('panel manager isOpen', () => {
  it('is false without a connected side panel', () => {
    const { getPanelManager } = loadPanel('webkit')

    expect(getPanelManager(makePm([{ id: 'p', name: 'popup' }]), () => true).isOpen()).toBe(false)
  })

  it('is false while side panel mode is off, even with a connected panel', () => {
    const { getPanelManager } = loadPanel('webkit')

    expect(getPanelManager(makePm([{ id: 'a', name: 'side-panel' }]), () => false).isOpen()).toBe(
      false
    )
  })

  it('counts any connected panel when no window is asked about', () => {
    const { getPanelManager } = loadPanel('webkit')

    expect(getPanelManager(makePm([{ id: 'a', name: 'side-panel' }]), () => true).isOpen()).toBe(
      true
    )
  })

  it('counts a panel for a window only once it has reported that window', () => {
    const { getPanelManager, setPanelWindowId, forgetPanelWindowId } = loadPanel('webkit')
    const panel = getPanelManager(makePm([{ id: 'a', name: 'side-panel' }]), () => true)

    // Connected, but hasn't reported its window yet
    expect(panel.isOpen(APP_WINDOW_ID)).toBe(false)

    setPanelWindowId('a', APP_WINDOW_ID)
    expect(panel.isOpen(APP_WINDOW_ID)).toBe(true)
    expect(panel.isOpen(OTHER_WINDOW_ID)).toBe(false)

    forgetPanelWindowId('a')
    expect(panel.isOpen(APP_WINDOW_ID)).toBe(false)
  })
})

describe('dapp tab focus dispatcher', () => {
  it('nudges the app tab only when a panel in its window showed the request', () => {
    const { getDappTabFocusDispatcher, setPanelWindowId } = loadPanel('webkit')
    setPanelWindowId('a', APP_WINDOW_ID)
    const dispatch = getDappTabFocusDispatcher(
      makePm([{ id: 'a', name: 'side-panel' }]),
      () => true
    )

    dispatch([{ tabId: 1, windowId: OTHER_WINDOW_ID }])
    expect(mockScheduleDappTabFocusDispatch).not.toHaveBeenCalled()

    const targets = [{ tabId: 1, windowId: APP_WINDOW_ID }]
    dispatch(targets)
    expect(mockScheduleDappTabFocusDispatch).toHaveBeenCalledWith(targets)
  })
})

describe('isSidePanelOnLeft on Firefox', () => {
  it('uses the side the sidebar stored', async () => {
    const { isSidePanelOnLeft } = loadPanel('gecko')

    mockStorageLocalGet.mockResolvedValueOnce({ isFirefoxSidebarOnLeft: false })
    expect(await isSidePanelOnLeft()).toBe(false)

    mockStorageLocalGet.mockResolvedValueOnce({ isFirefoxSidebarOnLeft: true })
    expect(await isSidePanelOnLeft()).toBe(true)
  })

  it("falls back to Firefox's default left side when nothing is stored", async () => {
    const { isSidePanelOnLeft } = loadPanel('gecko')

    mockStorageLocalGet.mockResolvedValueOnce({})
    expect(await isSidePanelOnLeft()).toBe(true)
  })

  it('falls back to the left side when reading the storage fails', async () => {
    const { isSidePanelOnLeft } = loadPanel('gecko')
    // The failure is logged on purpose - kept out of the test output
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockStorageLocalGet.mockRejectedValueOnce(new Error('storage unavailable'))
    expect(await isSidePanelOnLeft()).toBe(true)
    expect(consoleError).toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
