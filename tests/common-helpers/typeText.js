export async function typeText(page, selector, text) {
  await page.waitForSelector(selector, { visible: true, timeout: 5000 })
  const whereToType = await page.$(selector)
  await whereToType.click({ clickCount: 3 })
  await whereToType.press('Backspace')
  await whereToType.type(text, { delay: 90 })
}
