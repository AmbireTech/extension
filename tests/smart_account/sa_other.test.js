import { bootstrapWithStorage } from '../common-helpers/bootstrapWithStorage'
import { saParams } from '../constants/constants'

import { changePassword, addContactInAddressBook } from '../common/other.js'

describe('sa_other', () => {
  let browser
  let page
  let recorder
  let extensionURL

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
