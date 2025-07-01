// function for finding and clicking on a dom element
// by default the function will wait for the button element to become enabled in order to click on it

export async function clickOnElement(page, selector, waitUntilEnabled = true, clickDelay = 0) {
  let elementToClick

  // Define a timeout for throwing an error if the selector is not found after 10 seconds
  const timeout = 20000 // 20 seconds
  const startTime = Date.now()

  const executeClick = async () => {
    if (clickDelay > 0) await new Promise((resolve) => setTimeout(resolve, clickDelay))
    if (!elementToClick) return
    try {
      return await elementToClick.click()
    } catch (error) {
      // sometimes the button is in the DOM and it is enabled but it is not in the area of the screen
      // where it can be clicked. In that case settings a small timeout before clicking works just fine
      // but a more reliable option is to use page.$eval
      await page.$eval(selector, (el) => el.click())
    }
  }
  const waitForClickable = async () => {
    // Check if more than given time has passed
    const elapsedTime = Date.now() - startTime
    if (elapsedTime >= timeout) {
      throw new Error(
        `Element with selector '${selector}' not found or not clickable after ${
          timeout / 1000
        } seconds.`
      )
    }

    const isClickable = await page.evaluate((_selector) => {
      try {
        const buttonElement = document.querySelector(_selector)
        const style = window.getComputedStyle(buttonElement)
        const isClickableByCSS = style.pointerEvents !== 'none'

        return !!buttonElement && !buttonElement.disabled && isClickableByCSS
      } catch (error) {
        // Some Puppeteer selectors are not valid for querySelector.
        // In such cases, skip the enabled check and assume the button should be enabled.
        // This is because accessing the actual DOM element and checking its properties is not straightforward in that case
        return true
      }
    }, selector)

    if (isClickable === 'disabled') return
    if (isClickable) {
      return executeClick()
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
    return waitForClickable()
  }

  try {
    elementToClick = await page.waitForSelector(selector, { visible: true, timeout })
  } catch (error) {
    throw new Error(
      `Failed to find element with selector '${selector}' within ${timeout / 1000} seconds.`
    )
  }

  if (waitUntilEnabled) {
    await waitForClickable()
  } else {
    await executeClick()
  }
}
