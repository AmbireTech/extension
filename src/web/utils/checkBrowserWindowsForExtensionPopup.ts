interface ReturnType {
  extensionPopupExists: boolean
  windowId?: number
}

export async function checkBrowserWindowsForExtensionPopup(): Promise<ReturnType> {
  const windows = await browser.windows.getAll({ populate: true })

  const result: ReturnType = { extensionPopupExists: false }
  windows.forEach((window) => {
    if (
      window.type === 'popup' &&
      window?.tabs?.some((tab) => tab?.url?.includes(browser.runtime.id))
    ) {
      result.extensionPopupExists = true
      result.windowId = window.id
    }
  })

  return result
}
