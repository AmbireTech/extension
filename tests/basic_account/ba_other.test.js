import { bootstrapWithStorage, baParams } from '../functions.js'
import { changePassword, addContactInAddressBook } from '../common/other.js'

describe('ba_other', () => {
  let browser
  let page
  let recorder
  let extensionRootUrl

  beforeEach(async () => {
    const context = await bootstrapWithStorage('ba_other', baParams)

    browser = context.browser
    page = context.page
    page.setDefaultTimeout(240000)
    recorder = context.recorder
    extensionRootUrl = context.extensionRootUrl
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })
  it('change password', async () => {
    await changePassword(page, extensionRootUrl)
  })

  it('add contact in address book', async () => {
    await addContactInAddressBook(page, extensionRootUrl)
  })
})
