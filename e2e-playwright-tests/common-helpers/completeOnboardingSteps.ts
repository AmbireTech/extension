import { expect } from '@playwright/test'

import { SELECTORS } from 'constants/selectors'
import { clickOnElement } from './clickOnElement'

export async function completeOnboardingSteps(page) {
  // Expect the current page to be "get-started"
  const currentPageURL = await page.url()
  expect(currentPageURL.endsWith('get-started')).toBeTruthy()

  // Click on "Next" button several times to finish the onboarding.
  await clickOnElement(page, '[data-testid="stories-button-next-0"]')
  await clickOnElement(page, '[data-testid="stories-button-next-1"]')
  await clickOnElement(page, '[data-testid="stories-button-next-2"]')
  await clickOnElement(page, '[data-testid="stories-button-next-3"]')
  await clickOnElement(page, '[data-testid="stories-button-next-4"]')

  // check the checkbox "I agree ..."
  await clickOnElement(page, SELECTORS.checkbox)

  // Click on "Got it"
  await clickOnElement(page, '[data-testid="stories-button-next-5"]')
}
