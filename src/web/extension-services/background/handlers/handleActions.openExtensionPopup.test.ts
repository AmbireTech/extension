let mockEngine: 'webkit' | 'gecko' = 'gecko'
let mockNow = 0
const mockStorageGet = jest.fn(async (_key: string, defaultValue?: unknown) => defaultValue)
const mockOpenPanel = jest.fn()
const mockPanelWindowIds: Record<string, number> = {}

jest.mock('@web/constants/browserapi', () => ({
  get engine() {
    return mockEngine
  },
  browser: { action: { openPopup: jest.fn(async () => {}) } }
}))
jest.mock('@common/services/storage', () => ({
  storage: { get: (key: string, defaultValue?: unknown) => mockStorageGet(key, defaultValue) }
}))
jest.mock('../webapi/sessionStorage', () => ({
  __esModule: true,
  default: { get: async () => false, set: async () => null }
}))
jest.mock('@web/extension-services/background/webapi/panel', () => ({
  getPanelWindowId: (portId: string) => mockPanelWindowIds[portId],
  openPanel: (windowId?: number) => mockOpenPanel(windowId),
  setPanelWindowId: jest.fn()
}))
// Each wait moves the clock on instead of waiting, so the 10s wait for the wallet runs instantly
jest.mock('@ambire-common/utils/wait', () => ({
  __esModule: true,
  default: async (ms: number) => {
    mockNow += ms
  }
}))
jest.mock('./dispatchDappTabFocus', () => ({}))
jest.mock('@web/extension-services/background/CrashAnalytics', () => ({
  captureBackgroundException: jest.fn()
}))
jest.mock('@web/extension-services/messengers', () => ({}))
jest.mock('@ambire-common/controllers/main/main', () => ({ MainController: class {} }))
jest.mock('@ambire-common/libs/keyIterator/keyIterator', () => ({ KeyIterator: class {} }))
jest.mock('@common/modules/hardware-wallet/libs/ledgerKeyIterator', () => ({
  __esModule: true,
  default: class {}
}))
jest.mock('@common/modules/hardware-wallet/libs/trezorKeyIterator', () => ({
  __esModule: true,
  default: class {}
}))
jest.mock('@common/modules/hardware-wallets/libs/qrKeyIterator/qrKeyIterator', () => ({
  __esModule: true,
  default: class {}
}))
jest.mock('@web/modules/hardware-wallet/libs/latticeKeyIterator', () => ({
  __esModule: true,
  default: class {}
}))
jest.mock('@common/utils/serializeControllerForUI', () => ({ serializeControllerForUI: jest.fn() }))

import { handleActions } from './handleActions'

const SENDER_WINDOW_ID = 1
const OTHER_WINDOW_ID = 2

const NAVIGATE_TO_DASHBOARD = { method: 'navigate', params: { route: '/', options: {} } }

const senderPort = { id: 'tab', name: 'tab', sender: { tab: { windowId: SENDER_WINDOW_ID } } }

const openExtensionPopup = async ({
  ports,
  hasOpenedFirefoxSidebar
}: {
  ports: { id: string; name: string }[]
  hasOpenedFirefoxSidebar?: boolean
}) => {
  const pm = { ports: [senderPort, ...ports], sendToPort: jest.fn() }
  const mainCtrl = { onPopupOpen: jest.fn(async () => {}) }

  await handleActions(
    { type: 'OPEN_EXTENSION_POPUP', params: { hasOpenedFirefoxSidebar } } as any,
    {
      eventEmitterRegistry: {} as any,
      mainCtrl: mainCtrl as any,
      pm: pm as any,
      port: senderPort as any,
      meta: { windowId: SENDER_WINDOW_ID } as any
    }
  )

  return { pm, mainCtrl }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockEngine = 'gecko'
  mockNow = 0
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow)
  Object.keys(mockPanelWindowIds).forEach((portId) => delete mockPanelWindowIds[portId])
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('OPEN_EXTENSION_POPUP on Firefox', () => {
  it("shows the dashboard in the sender's view when panel mode is on but the UI didn't open the sidebar", async () => {
    mockStorageGet.mockResolvedValueOnce(true)

    const { pm } = await openExtensionPopup({ ports: [] })

    expect(pm.sendToPort).toHaveBeenCalledTimes(1)
    expect(pm.sendToPort).toHaveBeenCalledWith(senderPort, '> ui', NAVIGATE_TO_DASHBOARD)
  })

  it("navigates the sidebar open in the sender's window to the dashboard", async () => {
    const panelPort = { id: 'panel', name: 'side-panel' }
    mockPanelWindowIds.panel = SENDER_WINDOW_ID

    const { pm, mainCtrl } = await openExtensionPopup({
      ports: [panelPort],
      hasOpenedFirefoxSidebar: true
    })

    expect(pm.sendToPort).toHaveBeenCalledWith(panelPort, '> ui', {
      method: 'navigate',
      params: { route: '/' }
    })
    expect(mainCtrl.onPopupOpen).toHaveBeenCalledWith('panel')
  })

  it("leaves a sidebar in another window alone and falls back to the sender's dashboard", async () => {
    const otherWindowPanelPort = { id: 'other-panel', name: 'side-panel' }
    mockPanelWindowIds['other-panel'] = OTHER_WINDOW_ID

    const { pm, mainCtrl } = await openExtensionPopup({
      ports: [otherWindowPanelPort],
      hasOpenedFirefoxSidebar: true
    })

    expect(pm.sendToPort).not.toHaveBeenCalledWith(
      otherWindowPanelPort,
      expect.anything(),
      expect.anything()
    )
    expect(mainCtrl.onPopupOpen).not.toHaveBeenCalled()
    expect(pm.sendToPort).toHaveBeenCalledWith(senderPort, '> ui', NAVIGATE_TO_DASHBOARD)
  })
})

describe('OPEN_EXTENSION_POPUP on Chrome', () => {
  it("opens the side panel in the sender's window when panel mode is on", async () => {
    mockEngine = 'webkit'
    mockStorageGet.mockResolvedValueOnce(true)
    const panelPort = { id: 'panel', name: 'side-panel' }
    // The panel connects and reports its window once it's opened
    mockOpenPanel.mockImplementationOnce(async () => {
      mockPanelWindowIds.panel = SENDER_WINDOW_ID
    })

    const { pm } = await openExtensionPopup({ ports: [panelPort] })

    expect(mockOpenPanel).toHaveBeenCalledWith(SENDER_WINDOW_ID)
    expect(pm.sendToPort).not.toHaveBeenCalledWith(senderPort, '> ui', NAVIGATE_TO_DASHBOARD)
  })
})
