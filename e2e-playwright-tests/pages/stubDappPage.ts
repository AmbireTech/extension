import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { expect, Page } from '@playwright/test'

import { BasePage } from './basePage'

/** What the app was told when one of its requests settled. */
export type DappRequestOutcome =
  | { status: 'resolved'; result: unknown }
  | { status: 'rejected'; code: number; message: string }

const STUB_DAPP_HTML =
  '<!doctype html><html><head><title>Ambire e2e app</title></head><body></body></html>'

const CONNECT_REQUEST_ID = 'connect'
const SWITCH_NETWORK_REQUEST_ID = 'switch-network'
const PROVIDER_INJECTION_TIMEOUT = 10000
const REQUEST_WINDOW_TIMEOUT = 15000
const REQUEST_OUTCOME_TIMEOUT = 30000
// The connect button stays disabled while the dApp security check is loading
const DAPP_SECURITY_CHECK_TIMEOUT = 30000
const TOGGLE_INPUT = 'input[type="checkbox"]'

/**
 * A blank app page that talks to the wallet only through `window.ethereum`, so a test can send
 * any request, from any account, and read back exactly what the app was told.
 */
export class StubDappPage extends BasePage {
  dappPage: Page

  /** Opens the app in its own tab, leaving the extension tab free for wallet actions. */
  async open() {
    await this.context.route(mainConstants.urls.stubDapp, (route) =>
      route.fulfill({ contentType: 'text/html', body: STUB_DAPP_HTML })
    )

    this.dappPage = await this.context.newPage()
    await this.dappPage.goto(mainConstants.urls.stubDapp)
    await this.dappPage.waitForFunction(() => Boolean((window as any).ethereum), undefined, {
      timeout: PROVIDER_INJECTION_TIMEOUT
    })
    await this.dappPage.evaluate(() => {
      const appWindow = window as any
      appWindow.e2eAccountsChangedEvents = []
      appWindow.ethereum.on('accountsChanged', (accounts: string[]) => {
        appWindow.e2eAccountsChangedEvents.push(accounts)
      })
    })
  }

  /** Every account list the app got through `accountsChanged` since it was opened, oldest first. */
  async getAccountsChangedEvents(): Promise<string[][]> {
    return this.dappPage.evaluate(() => (window as any).e2eAccountsChangedEvents)
  }

  /**
   * Connects the app and moves it to the given network. Without `allowedAccountAddrs` the app
   * gets the wallet's selected account, as with a normal connection. With them, the app is
   * connected with "Only connect some accounts" and is allowed exactly those accounts.
   */
  async connect(chainId: number, allowedAccountAddrs?: string[]) {
    const connectWindow = await this.sendRequest(CONNECT_REQUEST_ID, 'eth_requestAccounts', [])
    const connectButton = connectWindow.getByTestId(selectors.dappConnectButton)

    if (allowedAccountAddrs) await this.allowOnlyAccounts(connectWindow, allowedAccountAddrs)

    // RN-Web drops aria-disabled once the button is enabled, see SignMessagePage.signMessage
    await expect(connectButton).not.toHaveAttribute('aria-disabled', 'true', {
      timeout: DAPP_SECURITY_CHECK_TIMEOUT
    })
    // Listened for before the click, as the window can close before the click call returns
    const closePromise = connectWindow.waitForEvent('close', { timeout: REQUEST_WINDOW_TIMEOUT })
    await connectButton.click()
    await closePromise

    const connectOutcome = await this.getRequestOutcome(CONNECT_REQUEST_ID)
    expect(connectOutcome.status, `connecting the app: ${JSON.stringify(connectOutcome)}`).toBe(
      'resolved'
    )
    if (allowedAccountAddrs && connectOutcome.status === 'resolved') {
      expect(
        [...(connectOutcome.result as string[])].sort(),
        'the accounts the app got when connecting'
      ).toEqual([...allowedAccountAddrs].sort())
    }

    const switchNetworkOutcome = await this.sendRequestWithoutPrompt(
      SWITCH_NETWORK_REQUEST_ID,
      'wallet_switchEthereumChain',
      [{ chainId: `0x${chainId.toString(16)}` }]
    )
    expect(
      switchNetworkOutcome.status,
      `moving the app to chain ${chainId}: ${JSON.stringify(switchNetworkOutcome)}`
    ).toBe('resolved')
  }

  /**
   * Sends a request the wallet has to show to the user, and returns the request window it
   * opens. The request itself settles later, read it with `getRequestOutcome`.
   */
  async sendRequest(requestId: string, method: string, params: unknown[]): Promise<Page> {
    const requestWindowPromise = this.context.waitForEvent('page', {
      timeout: REQUEST_WINDOW_TIMEOUT
    })

    await this.startRequest(requestId, method, params)

    const requestWindow = await requestWindowPromise
    await requestWindow.waitForLoadState('domcontentloaded')

    return requestWindow
  }

  /** Sends a request the wallet answers without asking the user, and returns what the app was told. */
  async sendRequestWithoutPrompt(
    requestId: string,
    method: string,
    params: unknown[]
  ): Promise<DappRequestOutcome> {
    await this.startRequest(requestId, method, params)

    return this.getRequestOutcome(requestId)
  }

  /** Waits for the request to settle and returns what the app was told. */
  async getRequestOutcome(requestId: string): Promise<DappRequestOutcome> {
    const outcomeHandle = await this.dappPage.waitForFunction(
      (id) => (window as any).e2eRequestOutcomes?.[id],
      requestId,
      { timeout: REQUEST_OUTCOME_TIMEOUT }
    )

    try {
      return (await outcomeHandle.jsonValue()) as DappRequestOutcome
    } finally {
      await outcomeHandle.dispose()
    }
  }

  /** Whether the request is still waiting for the user, as the app sees it. */
  async isRequestPending(requestId: string): Promise<boolean> {
    return this.dappPage.evaluate((id) => !(window as any).e2eRequestOutcomes?.[id], requestId)
  }

  /**
   * Turns on "Only connect some accounts" on the connect screen and allows exactly the given
   * accounts. The account sheet is opened only when they differ from the toggle's default,
   * which is the selected account alone.
   */
  private async allowOnlyAccounts(connectWindow: Page, allowedAccountAddrs: string[]) {
    const scopedAccountsToggle = connectWindow.getByTestId(selectors.dappScopedAccountsToggle)

    await scopedAccountsToggle.click()
    await expect(
      scopedAccountsToggle.locator(TOGGLE_INPUT),
      'only connect some accounts'
    ).toBeChecked()

    const selectedAccountAddr = await this.getSelectedAccount()
    if (allowedAccountAddrs.length === 1 && allowedAccountAddrs[0] === selectedAccountAddr) return

    await connectWindow.getByTestId(selectors.dappScopedAccountsSelectorButton).click()
    const accountRows = connectWindow.locator(`[data-testid^="${selectors.dappAccountRow('')}"]`)
    await expect(accountRows.first()).toBeVisible()

    const rowTestIDs = await accountRows.evaluateAll((rows) =>
      rows.map((row) => row.getAttribute('data-testid') as string)
    )
    const allowedRowTestIDs = allowedAccountAddrs.map(selectors.dappAccountRow)
    expect(rowTestIDs, 'the accounts listed in the account sheet').toEqual(
      expect.arrayContaining(allowedRowTestIDs)
    )

    for (const rowTestID of rowTestIDs) {
      const row = connectWindow.getByTestId(rowTestID)
      const rowToggleInput = row.locator(TOGGLE_INPUT)
      const shouldBeAllowed = allowedRowTestIDs.includes(rowTestID)

      if ((await rowToggleInput.isChecked()) !== shouldBeAllowed) await row.click()
      await expect(rowToggleInput, rowTestID).toBeChecked({ checked: shouldBeAllowed })
    }

    const continueButton = connectWindow.getByTestId(selectors.dappScopedAccountsContinueButton)
    await continueButton.click()
    await expect(continueButton).toBeHidden()
  }

  private async startRequest(requestId: string, method: string, params: unknown[]) {
    // Not awaited inside the page, as the request only settles once the user acts on it
    await this.dappPage.evaluate(
      ({ id, requestMethod, requestParams }) => {
        const appWindow = window as any
        appWindow.e2eRequestOutcomes = appWindow.e2eRequestOutcomes || {}

        appWindow.ethereum.request({ method: requestMethod, params: requestParams }).then(
          (result: unknown) => {
            appWindow.e2eRequestOutcomes[id] = { status: 'resolved', result }
          },
          (error: { code: number; message: string }) => {
            appWindow.e2eRequestOutcomes[id] = {
              status: 'rejected',
              code: error.code,
              message: error.message
            }
          }
        )
      },
      { id: requestId, requestMethod: method, requestParams: params }
    )
  }
}
