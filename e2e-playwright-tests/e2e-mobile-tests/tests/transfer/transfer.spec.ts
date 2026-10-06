import { KEYSTORE_PASS } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, test } from '@mobilewright/test'

test.describe('transfer', { tag: '@transfer-mobile' }, () => {
  test.beforeEach('Clear device state', async () => {
    // reset logic
  })

  // TODO
  test.skip('should send a transcation and pay with current account gas tank', async ({
    screen,
    device
  }) => {
    await test.step('', async () => {})
    await test.step('', async () => {})
    await test.step('', async () => {})
  })
})
