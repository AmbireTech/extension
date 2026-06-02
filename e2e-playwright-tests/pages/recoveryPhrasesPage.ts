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
  constructor(opts: BootstrapContext) {
    super(opts)
  }

  async open(): Promise<void> {
    await this.click(selectors.dashboard.hamburgerButton)
    await this.checkUrl('/settings/general')
    await this.click(selectors.settings.navRecoveryPhrases)
    await this.checkUrl('/settings/recovery-phrases')
  }

  async getSeedCount(): Promise<number> {
    return this.page.locator('[data-testid^="recovery-phrase-row-"]').count()
  }

  async revealSeed(seedId: string): Promise<SeedRevealResult> {
    // Open the manage sheet and wait for the reveal button to be ready before clicking
    await this.click(selectors.keystoreMigration.manageRecoveryPhrase(seedId))
    const revealBtn = this.page.getByTestId(selectors.keystoreMigration.revealRecoveryPhraseButton)
    await revealBtn.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await revealBtn.click()

    // Fill password in the PasswordConfirmation sheet and submit
    const passInput = this.page.getByTestId(selectors.passphraseField)
    await passInput.waitFor({ state: 'visible', timeout: PRESENCE_TIMEOUT })
    await passInput.fill(KEYSTORE_PASS)
    await this.click(selectors.submitButton)

    // Wait for the real phrase to replace the dummy placeholder (async controller response)
    const phraseEl = this.page.getByTestId(selectors.keystoreMigration.recoveryPhraseValue)
    await expect(phraseEl).not.toHaveText(DUMMY_SEED, { timeout: 15000 })

    const phrase = await phraseEl.innerText()

    const passphraseEl = this.page.getByTestId(
      selectors.keystoreMigration.recoveryPhrasePassphraseValue
    )
    const passphrase = (await passphraseEl.isVisible()) ? await passphraseEl.innerText() : null

    // Close the manage-phrase sheet and wait for the visible count to drop by 1.
    // Using count-1 (not 0) is correct because other hidden-but-DOM-present sheets in
    // the settings page may have their own panel-back-btns in the DOM.
    const visibleBefore = await this.page.locator('[data-testid="panel-back-btn"]:visible').count()
    await this.page.getByTestId('panel-back-btn').last().click()
    await expect(this.page.locator('[data-testid="panel-back-btn"]:visible')).toHaveCount(
      Math.max(0, visibleBefore - 1),
      { timeout: PRESENCE_TIMEOUT }
    )

    return { phrase, passphrase }
  }
}
