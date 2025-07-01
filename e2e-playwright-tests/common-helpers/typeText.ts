export async function typeText(page, selector, text, options = {}) {
  // TODO: Migration - Add options for delay, timeout, etc.
  await page.waitForSelector(selector, { visible: true, timeout: 5000 })
  const whereToType = await page.$(selector)
  await whereToType.click({ clickCount: 3 })
  await whereToType.press('Backspace')
  await whereToType.type(text, { delay: 65 })
}
