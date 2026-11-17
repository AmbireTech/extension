import { SA_ADDRESS, saParams } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import { test } from 'fixtures/pageObjects'

import { expect } from '@playwright/test'

const ALLOWED_ACCOUNT_ADDR: string = SA_ADDRESS
const NOT_ALLOWED_ACCOUNT_ADDR: string | undefined = saParams.parsedKeystoreAccounts.find(
  ({ addr }: { addr: string }) => addr !== ALLOWED_ACCOUNT_ADDR
)?.addr

const CHAIN_ID = mainConstants.chainIds.base
const ACCOUNTS_REQUEST_ID = 'accounts'
const UNLOCK_EVENT_TIMEOUT = 15000

/**
 * Whether the app got an account list after the empty one it gets when the wallet locks. Expects
 * only the events sent since locking, as the app also gets an empty list before it connects.
 */
const hasEventAfterLock = (accountsChangedEventsSinceLock: string[][]) => {
  const lockEventIndex = accountsChangedEventsSinceLock.findIndex((accounts) => !accounts.length)

  return lockEventIndex !== -1 && accountsChangedEventsSinceLock.length > lockEventIndex + 1
}

test.describe('dappAccountPermissions', { tag: '@dappAccountPermissions' }, () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ pages }) => {
    if (!NOT_ALLOWED_ACCOUNT_ADDR) {
      throw new Error(
        `SA_ACCOUNTS has to hold a second account next to ${ALLOWED_ACCOUNT_ADDR} for these tests`
      )
    }

    await pages.initWithStorage(saParams)
    await pages.stubDapp.open()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  test('accounts outside the allowed list never reach the app', async ({ pages }) => {
    await test.step('connect the app allowing only the selected account', async () => {
      expect(await pages.dashboard.getSelectedAccount()).toBe(ALLOWED_ACCOUNT_ADDR)
      await pages.stubDapp.connect(CHAIN_ID, [ALLOWED_ACCOUNT_ADDR])
    })

    await test.step('select an account the app is not allowed to see', async () => {
      await pages.dashboard.selectAccount(NOT_ALLOWED_ACCOUNT_ADDR!)
    })

    await test.step('lock and unlock the wallet', async () => {
      const eventCountBeforeLock = (await pages.stubDapp.getAccountsChangedEvents()).length

      await pages.settings.unlockKeystore()

      await expect
        .poll(
          async () =>
            hasEventAfterLock(
              (await pages.stubDapp.getAccountsChangedEvents()).slice(eventCountBeforeLock)
            ),
          {
            message: 'the app being told about the lock and then the unlock',
            timeout: UNLOCK_EVENT_TIMEOUT
          }
        )
        .toBe(true)
    })

    await test.step('the app was only ever told about the allowed account', async () => {
      const accountsChangedEvents = await pages.stubDapp.getAccountsChangedEvents()
      const eventsWithNotAllowedAccount = accountsChangedEvents.filter((accounts) =>
        accounts.some((addr) => addr.toLowerCase() === NOT_ALLOWED_ACCOUNT_ADDR!.toLowerCase())
      )

      expect(
        eventsWithNotAllowedAccount,
        `accountsChanged events the app got: ${JSON.stringify(accountsChangedEvents)}`
      ).toEqual([])
      expect(
        await pages.stubDapp.sendRequestWithoutPrompt(ACCOUNTS_REQUEST_ID, 'eth_accounts', [])
      ).toEqual({ status: 'resolved', result: [ALLOWED_ACCOUNT_ADDR] })
    })
  })
})
