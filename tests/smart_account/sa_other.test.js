import { bootstrapWithStorage, saParams } from '../common-helpers/functions.js'
import { changePassword, addContactInAddressBook } from '../common/other.js'

describe('sa_other', () => {
  let browser, page, recorder, extensionURL

  beforeEach(async () => {
    ;({ browser, page, recorder, extensionURL } = await bootstrapWithStorage('sa_other', saParams))
  })

  afterEach(async () => {
    await recorder.stop()
    await browser.close()
  })
  it('change password', async () => {
    await changePassword(page, extensionURL)
  })

  it('add contact in address book', async () => {
    await addContactInAddressBook(page, extensionURL)
  })
})
