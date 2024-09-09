import { clickOnElement } from './clickOnElement'

export async function selectPolToken(page) {
  await clickOnElement(page, '[data-testid="tokens-select"]')
  await clickOnElement(
    page,
    '[data-testid="option-0x0000000000000000000000000000000000000000.polygon.pol.false."]'
  )
}
