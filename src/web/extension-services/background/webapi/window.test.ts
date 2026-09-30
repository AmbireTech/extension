const SMALL_WORK_AREA = { left: 0, top: 0, width: 1366, height: 767 }

jest.mock(
  '@web/constants/browserapi',
  () => ({
    browser: {
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
  () => ({ isSidePanelModeEnabled: async () => false }),
  { virtual: true }
)
jest.mock('@web/utils/sidePanel', () => ({ isExtensionOverlayPort: jest.fn() }), {
  virtual: true
})

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
