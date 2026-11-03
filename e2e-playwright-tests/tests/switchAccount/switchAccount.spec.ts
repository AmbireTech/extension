import { SA_ADDRESS, saParams } from 'constants/env'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'
import { hexlify, toUtf8Bytes, verifyMessage } from 'ethers'
import { test } from 'fixtures/pageObjects'

import { BrowserContext, expect, Page } from '@playwright/test'

const SMART_ACCOUNT_ADDR: string = SA_ADDRESS
const BASIC_ACCOUNT_ADDR: string | undefined = saParams.parsedKeystoreAccounts.find(
  ({ addr }: { addr: string }) => addr !== SMART_ACCOUNT_ADDR
)?.addr

const CHAIN_ID = mainConstants.chainIds.base
const WALLET_SEND_CALLS_VERSION = '2.0.0'
const ZERO_VALUE = '0x0'
const ONE_WEI = '0x1'
const MESSAGE = 'Ambire e2e - sign after switching accounts'

const TRANSACTION_SWITCH_REASON = 'Switch to this account to sign the transaction.'
const MESSAGE_SWITCH_REASON = 'Switch to this account to sign the message.'
const SWITCH_ACCOUNT_TITLE = 'Switch account request from'

const REQUEST_SCREEN_TIMEOUT = 30000
const REQUEST_WINDOW_CLOSE_TIMEOUT = 15000

type TransactionMethod = 'eth_sendTransaction' | 'wallet_sendCalls'

const TRANSACTION_METHODS: TransactionMethod[] = ['eth_sendTransaction', 'wallet_sendCalls']

const buildTransactionParams = (method: TransactionMethod, from: string, value: string) => {
  const call = { to: BASIC_ACCOUNT_ADDR, value }

  if (method === 'eth_sendTransaction') return [{ from, ...call }]

  return [
    {
      version: WALLET_SEND_CALLS_VERSION,
      chainId: `0x${CHAIN_ID.toString(16)}`,
      from,
      atomicRequired: true,
      calls: [call]
    }
  ]
}

const expectSwitchAccountPrompt = async (requestWindow: Page, switchReason: string) => {
  await expect(requestWindow.getByText(SWITCH_ACCOUNT_TITLE)).toBeVisible({
    timeout: REQUEST_SCREEN_TIMEOUT
  })
  await expect(requestWindow.getByText(switchReason)).toBeVisible()
}

const getOpenRequestWindows = (context: BrowserContext) =>
  context
    .pages()
    .filter((page) => !page.isClosed() && page.url().includes(mainConstants.urls.requestWindow))

/** Rejects the request on screen, picking "only this one" when the wallet offers more options. */
const rejectRequest = async (requestWindow: Page, rejectButtonTestID: string) => {
  const rejectCurrentOption = requestWindow.getByTestId(selectors.rejectRequestOptionCurrent)
  // Listened for before the click, as the window can close before the click call returns
  const closePromise = requestWindow.waitForEvent('close', {
    timeout: REQUEST_WINDOW_CLOSE_TIMEOUT
  })

  await requestWindow.getByTestId(rejectButtonTestID).click()
  await Promise.race([
    closePromise,
    // When there are no options the window closes and this click can never land
    rejectCurrentOption.click({ timeout: REQUEST_WINDOW_CLOSE_TIMEOUT }).catch((error) => {
      if (!requestWindow.isClosed()) throw error
    })
  ])

  await closePromise
}

type DenySwitchCase = {
  name: string
  switchReason: string
  method: string
  getParams: () => unknown[]
}

// Both come from the basic account while the smart account is selected
const DENY_CASES: DenySwitchCase[] = [
  {
    name: 'message',
    switchReason: MESSAGE_SWITCH_REASON,
    method: 'personal_sign',
    getParams: () => [hexlify(toUtf8Bytes(MESSAGE)), BASIC_ACCOUNT_ADDR]
  },
  {
    name: 'transaction',
    switchReason: TRANSACTION_SWITCH_REASON,
    method: 'eth_sendTransaction',
    getParams: () => buildTransactionParams('eth_sendTransaction', BASIC_ACCOUNT_ADDR!, ZERO_VALUE)
  }
]

test.describe('switchAccount', { tag: '@switchAccount' }, () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ pages }) => {
    if (!BASIC_ACCOUNT_ADDR) {
      throw new Error(
        `SA_ACCOUNTS has to hold a second account next to ${SMART_ACCOUNT_ADDR} for these tests`
      )
    }

    await pages.initWithStorage(saParams)
    await pages.stubDapp.open()
  })

  test.afterEach(async ({ context }) => {
    await context.close()
  })

  // The app connects as usual and keeps sending from its old account after the user switches
  test.describe('connected as usual', () => {
    test.beforeEach(async ({ pages }) => {
      await pages.stubDapp.connect(CHAIN_ID)
    })

    test(`${TRANSACTION_METHODS.join(' and ')} from an account that isn't selected ask to switch, then show the transaction in the same window`, async ({
      pages
    }) => {
      for (const method of TRANSACTION_METHODS) {
        const requestId = `transaction-${method}`
        let requestWindow: Page

        await test.step(`${method}: select the basic account`, async () => {
          await pages.dashboard.selectAccount(BASIC_ACCOUNT_ADDR!)
        })

        await test.step(`${method}: the app asks for a transaction from the smart account`, async () => {
          requestWindow = await pages.stubDapp.sendRequest(
            requestId,
            method,
            buildTransactionParams(method, SMART_ACCOUNT_ADDR, ZERO_VALUE)
          )

          await expectSwitchAccountPrompt(requestWindow, TRANSACTION_SWITCH_REASON)
        })

        await test.step(`${method}: switching shows the transaction for the smart account`, async () => {
          await requestWindow.getByTestId(selectors.switchAccountButton).click()

          await expect(requestWindow.getByTestId(selectors.transactionCallDyn(0))).toBeVisible({
            timeout: REQUEST_SCREEN_TIMEOUT
          })
          expect(await pages.dashboard.getSelectedAccount()).toBe(SMART_ACCOUNT_ADDR)
          expect(getOpenRequestWindows(pages.stubDapp.context)).toEqual([requestWindow])
        })

        await test.step(`${method}: rejecting the transaction tells the app the user refused`, async () => {
          await rejectRequest(requestWindow, selectors.transactionButtonReject)

          expect(await pages.stubDapp.getRequestOutcome(requestId)).toMatchObject({
            status: 'rejected',
            code: mainConstants.dappErrorCodes.userRejected
          })
        })
      }
    })

    test("a transaction for an account that isn't selected joins its batch only after the switch", async ({
      pages
    }) => {
      const firstRequestId = 'first-transaction'
      const secondRequestId = 'second-transaction'
      let requestWindow: Page

      await test.step('the smart account starts a batch with a transaction from the app', async () => {
        const firstRequestWindow = await pages.stubDapp.sendRequest(
          firstRequestId,
          'eth_sendTransaction',
          buildTransactionParams('eth_sendTransaction', SMART_ACCOUNT_ADDR, ZERO_VALUE)
        )
        const startBatchButton = firstRequestWindow.getByTestId(selectors.queueAndSignLaterButton)

        // Disabled until the transaction is estimated
        await expect(startBatchButton).not.toHaveAttribute('aria-disabled', 'true', {
          timeout: REQUEST_SCREEN_TIMEOUT
        })
        const closePromise = firstRequestWindow.waitForEvent('close', {
          timeout: REQUEST_WINDOW_CLOSE_TIMEOUT
        })
        await startBatchButton.click()
        await closePromise

        expect(await pages.stubDapp.isRequestPending(firstRequestId)).toBe(true)
      })

      await test.step('select the basic account', async () => {
        await pages.dashboard.selectAccount(BASIC_ACCOUNT_ADDR!)
      })

      await test.step('another transaction from the smart account asks to switch first', async () => {
        requestWindow = await pages.stubDapp.sendRequest(
          secondRequestId,
          'eth_sendTransaction',
          buildTransactionParams('eth_sendTransaction', SMART_ACCOUNT_ADDR, ONE_WEI)
        )

        await expectSwitchAccountPrompt(requestWindow, TRANSACTION_SWITCH_REASON)
        expect(await pages.dashboard.getSelectedAccount()).toBe(BASIC_ACCOUNT_ADDR)
      })

      await test.step('switching shows both transactions in one batch', async () => {
        await requestWindow.getByTestId(selectors.switchAccountButton).click()

        await expect(requestWindow.getByTestId(selectors.transactionCallDyn(0))).toBeVisible({
          timeout: REQUEST_SCREEN_TIMEOUT
        })
        await expect(requestWindow.getByTestId(selectors.transactionCallDyn(1))).toBeVisible()
        await expect(requestWindow.getByTestId(selectors.transactionCallDyn(2))).toHaveCount(0)
        expect(await pages.dashboard.getSelectedAccount()).toBe(SMART_ACCOUNT_ADDR)
      })

      await test.step('rejecting the batch tells the app both were refused', async () => {
        await rejectRequest(requestWindow, selectors.transactionButtonReject)

        for (const requestId of [firstRequestId, secondRequestId]) {
          expect(await pages.stubDapp.getRequestOutcome(requestId), requestId).toMatchObject({
            status: 'rejected',
            code: mainConstants.dappErrorCodes.userRejected
          })
        }
      })
    })
  })

  // The app is allowed only an account that isn't selected, so it can only ever ask that one
  test.describe('connected with only the basic account', () => {
    test.beforeEach(async ({ pages }) => {
      await pages.stubDapp.connect(CHAIN_ID, [BASIC_ACCOUNT_ADDR!])
      // Connecting picked the basic account for the app, which also selected it in the wallet
      await pages.dashboard.selectAccount(SMART_ACCOUNT_ADDR)
    })

    test("a message for an account that isn't selected is shown in the same window after the switch", async ({
      pages
    }) => {
      const requestId = 'message'
      let requestWindow: Page

      await test.step('the app asks the basic account to sign a message', async () => {
        requestWindow = await pages.stubDapp.sendRequest(requestId, 'personal_sign', [
          hexlify(toUtf8Bytes(MESSAGE)),
          BASIC_ACCOUNT_ADDR
        ])

        await expectSwitchAccountPrompt(requestWindow, MESSAGE_SWITCH_REASON)
      })

      await test.step('switching shows the message in the same window', async () => {
        await requestWindow.getByTestId(selectors.switchAccountButton).click()

        await expect(requestWindow.getByTestId(selectors.signMessageButton)).toBeVisible({
          timeout: REQUEST_SCREEN_TIMEOUT
        })
        expect(await pages.dashboard.getSelectedAccount()).toBe(BASIC_ACCOUNT_ADDR)
        expect(getOpenRequestWindows(pages.stubDapp.context)).toEqual([requestWindow])
        expect(await pages.stubDapp.isRequestPending(requestId)).toBe(true)
      })

      await test.step('signing gives the app a signature from the basic account', async () => {
        await requestWindow.getByTestId(selectors.signMessageButton).click()

        const outcome = await pages.stubDapp.getRequestOutcome(requestId)
        expect(outcome.status, JSON.stringify(outcome)).toBe('resolved')
        if (outcome.status !== 'resolved') return

        expect(verifyMessage(MESSAGE, outcome.result as string)).toBe(BASIC_ACCOUNT_ADDR)
      })
    })

    test('denying the switch for a message or a transaction tells the app the user refused', async ({
      pages
    }) => {
      for (const { name, switchReason, method, getParams } of DENY_CASES) {
        const requestId = `denied-${name}`

        await test.step(`the app asks for a ${name} from the basic account`, async () => {
          const requestWindow = await pages.stubDapp.sendRequest(requestId, method, getParams())

          await expectSwitchAccountPrompt(requestWindow, switchReason)
          await rejectRequest(requestWindow, selectors.switchAccountDenyButton)
        })

        await test.step(`the ${name} is refused and the smart account stays selected`, async () => {
          expect(await pages.stubDapp.getRequestOutcome(requestId)).toMatchObject({
            status: 'rejected',
            code: mainConstants.dappErrorCodes.userRejected
          })
          expect(await pages.dashboard.getSelectedAccount()).toBe(SMART_ACCOUNT_ADDR)
          expect(getOpenRequestWindows(pages.stubDapp.context)).toEqual([])
        })
      }
    })
  })
})
