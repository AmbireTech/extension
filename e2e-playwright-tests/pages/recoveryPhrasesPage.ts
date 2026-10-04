import { KEYSTORE_PASS } from 'constants/env'
import selectors from 'constants/selectors'
import BootstrapContext from 'interfaces/bootstrapContext'

import { expect } from '@playwright/test'

import { BasePage } from './basePage'

const PRESENCE_TIMEOUT = 4000

const DUMMY_SEED = 'dummy seed phrase canyon pigeon meadow orbit lunch erupt promote silver casino'

export type SeedRevealResult = {
  phrase: string
  passphrase: string | null
}

export class RecoveryPhrasesPage extends BasePage {
  private extensionURL?: string

  constructor(opts: BootstrapContext) {
    super(opts)
    this.extensionURL = opts.extensionURL
  }

  async open(): Promise<void> {
    // Callers arrive from anywhere - straight out of onboarding, where "Open wallet" leaves this
    // page on the completed screen and the dashboard hamburger never shows up. Always land on the
    // dashboard first (the keystore stays unlocked in the background across the reload).
    await this.navigateToURL(`${this.extensionURL}/tab.html#/dashboard`)
    await this.click(selectors.dashboard.hamburgerButton)
    await this.checkUrl('/settings/general')
    await this.click(selectors.settings.navRecoveryPhrases)
    await this.checkUrl('/settings/recovery-phrases')
  }

  async getSeedCount(): Promise<number> {
    return this.page.locator('[data-testid^="recovery-phrase-row-"]').count()
  }

  async getFirstSeedId(): Promise<string> {
    const row = this.page.locator('[data-testid^="recovery-phrase-row-"]').first()
    await row.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    const testId = await row.getAttribute('data-testid')

    if (!testId) throw new Error('No recovery phrase rows found')

    return testId.replace('recovery-phrase-row-', '')
  }

  async revealSeed({
    seedId,
    confirmModal = true
  }: {
    seedId: string
    confirmModal?: boolean
  }): Promise<SeedRevealResult> {
    const manageHeader = this.page.getByTestId(
      selectors.keystoreMigration.manageRecoveryPhraseHeader
    )

    // Open the manage sheet and confirm it actually opened before moving on - clicking the
    // row button doesn't guarantee the sheet finished mounting/animating in.
    await expect(async () => {
      await expect(
        this.page.getByTestId(selectors.keystoreMigration.manageRecoveryPhrase(seedId))
      ).toBeEnabled()
      await this.click(selectors.keystoreMigration.manageRecoveryPhrase(seedId))
      await expect(manageHeader).toBeVisible({ timeout: PRESENCE_TIMEOUT })
    }).toPass({ timeout: 30000 })

    const revealBtn = this.page.getByTestId(selectors.keystoreMigration.revealRecoveryPhraseButton)
    await revealBtn.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await revealBtn.click()

    // some flows do not require password confimation
    if (confirmModal) {
      // Fill password in the PasswordConfirmation sheet and submit
      const passInput = this.page.getByTestId(selectors.passphraseField)
      await passInput.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
      await passInput.fill(KEYSTORE_PASS)
      await this.click(selectors.submitButton)
    }

    // Wait for the real phrase to replace the dummy placeholder (async controller response)
    const phraseEl = this.page.getByTestId(selectors.keystoreMigration.recoveryPhraseValue)
    await expect(phraseEl).not.toHaveText(DUMMY_SEED, { timeout: 15000 })

    const phrase = await phraseEl.innerText()

    const passphraseEl = this.page.getByTestId(
      selectors.keystoreMigration.recoveryPhrasePassphraseValue
    )
    const passphrase = (await passphraseEl.isVisible()) ? await passphraseEl.innerText() : null

    // Close the manage-phrase sheet via its own back button (scoped to manageHeader, not the
    // page-wide "panel-back-btn" testid) and wait for the whole sheet to unmount - it's
    // conditionally rendered by the parent screen, so "hidden" here means fully closed.
    await expect(async () => {
      const backBtn = manageHeader.getByTestId('panel-back-btn')
      if (await backBtn.isVisible()) await backBtn.click()
      await expect(manageHeader).toBeHidden({ timeout: PRESENCE_TIMEOUT })
    }).toPass({ timeout: 30000 })

    return { phrase, passphrase }
  }
}
