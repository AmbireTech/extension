import { KEYSTORE_PASS } from 'constants/env'
import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'

import { expect } from '@playwright/test'

import { BasePage } from './basePage'

const PRESENCE_TIMEOUT = 4000

export class AccountKeysPage extends BasePage {
  private extensionURL?: string

  constructor(opts: BootstrapContext) {
    super(opts)
    this.extensionURL = opts.extensionURL
  }

  async open(): Promise<void> {
    // open() is re-callable across keys. A previous export leaves us deep inside the settings
    // stack where the dashboard hamburger no longer exists, so always return to the dashboard
    // first (the keystore stays unlocked in the background across the reload).
    await this.navigateToURL(`${this.extensionURL}/tab.html#/dashboard`)
    await this.click(selectors.dashboard.hamburgerButton)
    await this.checkUrl('/settings/general')
    await this.click(selectors.settings.navAccounts)
    await this.checkUrl('/settings/accounts')
  }

  // Closes the topmost visible sheet by clicking its panel-back-btn
  private async closeTopSheet(): Promise<void> {
    await this.page.getByTestId('panel-back-btn').last().click()
  }

  private async findAndOpenAccountKeys(keyAddr: string, accountAddr: string): Promise<void> {
    // Filter the (potentially long) account list down to the owning account so we scan a
    // handful of rows instead of every account. The options (kebab) button is keyed by the
    // account address, so even if fuzzy search returns a few extra rows we target the exact
    // one directly instead of guessing based on DOM position/structure.
    await this.entertext(selectors.searchInput, accountAddr)

    const accountRows = this.page.getByTestId('account')
    await expect(accountRows.first()).toBeVisible({ timeout: PRESENCE_TIMEOUT })

    const optionsBtn = this.page.getByTestId(selectors.settings.accountOptionsButton(accountAddr))
    await optionsBtn.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await optionsBtn.click()

    const manageKeys = this.page.getByText('Manage keys').first()
    await manageKeys.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await manageKeys.click()

    // Only locate the key's options (⋮) button here — the caller decides which key type's
    // menu to open, since one address can be imported as several key types.
    const keyOptionsBtn = this.page.locator(`[data-testid^="key-options-${keyAddr}-"]`).first()
    await keyOptionsBtn.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
  }

  async exportPrivateKey({
    keyAddr,
    accountAddr,
    confirmModal = true
  }: {
    keyAddr: string
    accountAddr: string
    confirmModal?: boolean
  }): Promise<string> {
    await this.open()
    await this.findAndOpenAccountKeys(keyAddr, accountAddr)

    const keyOptionsBtn = this.page.getByTestId(
      selectors.keystoreMigration.keyOptionsButton(keyAddr, 'internal')
    )
    await keyOptionsBtn.scrollIntoViewIfNeeded()
    await keyOptionsBtn.click()
    await this.page.getByText('Export key', { exact: true }).click()

    const revealBtn = this.page.getByTestId(selectors.keystoreMigration.revealPrivateKeyButton)
    await revealBtn.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await revealBtn.click()

    // some flows do not require password confimation
    if (confirmModal) {
      const passInput = this.page.getByTestId(selectors.passphraseField)
      await passInput.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
      await passInput.fill(KEYSTORE_PASS)
      await this.click(selectors.submitButton)
    }

    const keyEl = this.page.getByTestId(selectors.keystoreMigration.privateKeyValue)
    await expect(keyEl).not.toBeEmpty({ timeout: 15000 })
    const copyBtn = this.page.getByTestId(selectors.keystoreMigration.copyPrivateKeyButton)
    await expect(copyBtn).toBeVisible()
    await expect(revealBtn).toHaveText('Show key')
    await expect(keyEl.locator('..')).toHaveCSS('filter', 'blur(3px)')

    await this.context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await this.page.evaluate(() => navigator.clipboard.writeText('clipboard-test-sentinel'))
    let copiedPrivateKeyMatches = false
    try {
      await copyBtn.click()
      await expect(this.page.getByText('Private key copied to clipboard!')).toBeVisible()
      copiedPrivateKeyMatches = await keyEl.evaluate(async (element) => {
        return (await navigator.clipboard.readText()) === element.textContent
      })
    } finally {
      await this.page.evaluate(() => navigator.clipboard.writeText(''))
    }
    expect(copiedPrivateKeyMatches).toBe(true)

    await expect(revealBtn).toHaveText('Show key')
    await expect(keyEl.locator('..')).toHaveCSS('filter', 'blur(3px)')

    await revealBtn.click()
    await expect(revealBtn).toHaveText('Hide key')

    const privateKey = await keyEl.innerText()

    await revealBtn.click()
    await expect(revealBtn).toHaveText('Reveal key')

    // Close ExportKey then AccountKeys — each call drops visible count by 1
    await this.closeTopSheet()
    await this.closeTopSheet()

    return privateKey
  }

  async assertExportDisabled(keyAddr: string, accountAddr: string): Promise<void> {
    await this.open()
    await this.findAndOpenAccountKeys(keyAddr, accountAddr)

    // HW keys never leave the device, so their options (⋮) menu has no Export at all
    const keyOptionsBtn = this.page
      .locator(`[data-testid^="key-options-${keyAddr}-"]:not([data-testid$="-internal"])`)
      .first()
    await keyOptionsBtn.click()
    await expect(this.page.getByText('Remove key', { exact: true })).toBeVisible({
      timeout: PRESENCE_TIMEOUT
    })
    await expect(this.page.getByText('Export key', { exact: true })).toHaveCount(0)
    // A second press closes the menu
    await keyOptionsBtn.click()

    await this.closeTopSheet()
  }
}
