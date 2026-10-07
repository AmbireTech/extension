const SMALL_WORK_AREA = { left: 0, top: 0, width: 1366, height: 767 }

const mockIsSidePanelModeEnabled = jest.fn(async () => false)
const mockIsSidePanelOnLeft = jest.fn(async () => false)
const mockStorageLocalGet = jest.fn(async (): Promise<Record<string, unknown>> => ({}))

jest.mock(
  '@web/constants/browserapi',
  () => ({
    browser: {
      storage: { local: { get: () => mockStorageLocalGet() } },
      system: {
        display: {
          getInfo: async () => [{ isPrimary: true, workArea: SMALL_WORK_AREA }]
        }
      }
    },
    engine: 'webkit',
    isExtension: false,
    isSafari: () => false
  }),
  { virtual: true }
)
jest.mock('@web/constants/common', () => ({ IS_FIREFOX: false, IS_WINDOWS: false }), {
  virtual: true
})
jest.mock('@web/constants/spacings', () => jest.requireActual('../../../constants/spacings'), {
  virtual: true
})
jest.mock('@web/extension-services/messengers', () => ({}), { virtual: true })
jest.mock(
  '@web/extension-services/background/webapi/panel',
  () => ({
    isSidePanelModeEnabled: () => mockIsSidePanelModeEnabled(),
    isSidePanelOnLeft: () => mockIsSidePanelOnLeft()
  }),
  { virtual: true }
)
jest.mock(
  '@web/extension-services/background/CrashAnalytics',
  () => ({ captureBackgroundException: jest.fn() }),
  { virtual: true }
)
jest.mock(
  '@web/utils/sidePanel',
  () => ({ isExtensionOverlayPort: jest.fn(), SIDE_PANEL_WIDTH_STORAGE_KEY: 'sidePanelWidth' }),
  { virtual: true }
)

import windowManager from './window'

it('opens the window with whole-pixel bounds when the active tab reports no size', async () => {
  const originalIsTesting = process.env.IS_TESTING
  // IS_TESTING makes the size calculation return hardcoded CI values
  delete process.env.IS_TESTING
  const createWindow = jest.fn().mockResolvedValue({ id: 2 })
  ;(global as any).chrome = {
    windows: {
      get: jest.fn().mockResolvedValue({
        id: 1,
        left: 0,
        top: 0,
        width: 1280,
        height: 780,
        tabs: [{ active: true, width: 0, height: 0 }]
      }),
      create: createWindow
    }
  }

  try {
    await windowManager.open({ baseWindowId: 1 })

    // Without a tab size the window falls back to the base window height, capped by the 767px
    // work area, and sits at the right edge of the base window
    expect(createWindow).toHaveBeenCalledWith(
      expect.objectContaining({ width: 480, height: 767, left: 800, top: 0 })
    )
  } finally {
    delete (global as any).chrome
    if (originalIsTesting !== undefined) process.env.IS_TESTING = originalIsTesting
  }
})

describe('side panel mode', () => {
  const openInSidePanelMode = async () => {
    const createWindow = jest.fn().mockResolvedValue({ id: 2 })
    ;(global as any).chrome = {
      windows: {
        get: jest.fn().mockResolvedValue({
          id: 1,
          left: 0,
          top: 0,
          width: 1280,
          height: 780,
          tabs: [{ active: true, width: 0, height: 0 }]
        }),
        create: createWindow
      }
    }

    await windowManager.open({ baseWindowId: 1 })

    return createWindow
  }

  const originalIsTesting = process.env.IS_TESTING

  beforeEach(() => {
    // IS_TESTING makes the size calculation return hardcoded CI values
    delete process.env.IS_TESTING
    mockIsSidePanelModeEnabled.mockResolvedValue(true)
  })

  afterEach(() => {
    delete (global as any).chrome
    mockIsSidePanelModeEnabled.mockResolvedValue(false)
    mockIsSidePanelOnLeft.mockResolvedValue(false)
    mockStorageLocalGet.mockResolvedValue({})
    if (originalIsTesting !== undefined) process.env.IS_TESTING = originalIsTesting
  })

  it('opens the window at the width the user gave the side panel', async () => {
    mockStorageLocalGet.mockResolvedValue({ sidePanelWidth: 560.4 })

    const createWindow = await openInSidePanelMode()

    expect(createWindow).toHaveBeenCalledWith(expect.objectContaining({ width: 560, left: 720 }))
  })

  it('opens the window at the default side panel width when none is stored', async () => {
    const createWindow = await openInSidePanelMode()

    expect(createWindow).toHaveBeenCalledWith(expect.objectContaining({ width: 400, left: 880 }))
  })

  it('opens the window along the left edge when the side panel is on the left', async () => {
    mockIsSidePanelOnLeft.mockResolvedValue(true)

    const createWindow = await openInSidePanelMode()

    expect(createWindow).toHaveBeenCalledWith(expect.objectContaining({ width: 400, left: 0 }))
  })
})
