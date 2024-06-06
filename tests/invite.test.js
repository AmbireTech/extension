import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'
import { bootstrap, clickOnElement } from './functions.js'

describe('Invite Verification', () => {
  let browser
  let page
  let extensionId
  let recorder

  // TODO: Same logic as the one found in the ba_login.test.js and
  // sa_login.test.js, consider refactoring (so it's DRY).
  beforeEach(async () => {
    const context = await bootstrap()
    browser = context.browser
    extensionId = context.extensionId

    page = await browser.newPage()

    recorder = new PuppeteerScreenRecorder(page)
    await recorder.start(`./recorder/invite_${Date.now()}.mp4`)

    const getStartedPage = `chrome-extension://${extensionId}/tab.html#/get-started`
    await page.goto(getStartedPage)

    await new Promise((r) => {
      setTimeout(r, 3000)
    })
    await page.bringToFront()
    await page.reload()
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })

  it('should immediately redirect to the invite verification route', async () => {
    const href = await page.evaluate(() => window.location.href)
    expect(href).toContain('/invite-verify')
  })

  it('should verify a valid invite code and unlock the extension', async () => {
    await page.type(
      '[data-testid="verify-invite-code-input"]',
      process.env.DEFAULT_INVITATION_CODE_DEV
    )
    await clickOnElement(page, '[data-testid="verify-invite-code-submit"]')

    // Upon successful verification, the extension should redirect to the
    // get-started route, which otherwise is not accessible
    await page.waitForNavigation()

    const href = await page.evaluate(() => window.location.href)
    expect(href).toContain('/get-started')
  })

  it('should fire an error toast in case of an invalid invite code', async () => {
    await page.type('[data-testid="verify-invite-code-input"]', 'дъра-бъра-два-чадъра')
    await clickOnElement(page, '[data-testid="verify-invite-code-submit"]')

    // Wait for the error toast to appear in the DOM
    const errorToast = await page.waitForSelector('[data-testid^="error-"]', { timeout: 60000 })
    // and check if it is visible
    expect(await errorToast.isIntersectingViewport()).toBeTruthy()
  })
})
