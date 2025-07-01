import { clickOnElement } from './clickOnElement'

export async function selectUSDCTokenOnBase(page) {
  await clickOnElement(page, '[data-testid="tokens-select"]')
  await clickOnElement(
    page,
    '[data-testid="option-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.8453"]'
  )
}
