import { clickOnElement } from '../../common-helpers/clickOnElement'
import { typeText } from '../../common-helpers/typeText'
import { SELECTORS } from '../../common/selectors/selectors'
import {
  URL_SETTINGS_PAGE,
  URL_SETTINGS_GENERAL,
  URL_DEVICE_PASSWORD_CHANGE,
  NEW_KEYSTORE_PASSWORD,
  MANUAL_ADD_BTN,
  GREEN_MSG_NETWORK_ADDED,
  GREEN_MSG_NETWORK_SAVED,
  AMBIRE_SMART_ACCOUNTS_MSG,
  CHAINLIST_SEARCH_PLACEHOLDER,
  CONNECT_WALLET_BTN,
  NETWORKS_LIST
} from './constants'
import { DEF_KEYSTORE_PASS } from '../../config/constants'
import { typeKeystorePassAndUnlock } from '../../common-helpers/typeKeystorePassAndUnlock'

export async function setUpKeystore(page, extensionURL) {
  await page.goto(`${extensionURL}${URL_DEVICE_PASSWORD_CHANGE}`, {
    waitUntil: 'load'
  })

  await page.waitForSelector(SELECTORS.enterNewPassField)
  await typeText(page, SELECTORS.enterPassField, DEF_KEYSTORE_PASS)
  await typeText(page, SELECTORS.repeatPassField, DEF_KEYSTORE_PASS)
  await clickOnElement(page, SELECTORS.createKeystorePassBtn)

  await page.waitForSelector(SELECTORS.bottomSheet)
  await expectButtonIsVisible(page, SELECTORS.keystoreBtnContinue)

  await clickOnElement(page, SELECTORS.keystoreBtnContinue, true, 500)
  // Wait until the "Success device password" modal to be hidden
  await page.waitForSelector(SELECTORS.bottomSheet, { hidden: true })
}

async function verifyNetworkField(page, field, value) {
  const xpath = `//div[.//div[text()="${field}"] and .//div[text()="${value}"]]`
  await page.waitForXPath(xpath, { visible: true, timeout: 3000 })
  const [element] = await page.$x(xpath)
  expect(element).not.toBeNull()
}

async function selectNetworkButton(page, text) {
  const xpath = `//div[.//div[text()="Network details"]]//div[text()="${text}"]`
  await page.waitForXPath(xpath, { visible: true, timeout: 3000 })
  const [element] = await page.$x(xpath)
  expect(element).not.toBeNull()
  element.click()
}

async function verifyNetwork(page, network_name, assert = true, expectDisabled = false) {
  await page.waitForTimeout(1000)
  const xpath = `//div[.//div[text()="Network details"]]//div[text()="${network_name}"]`
  if (assert) {
    const element = await page.waitForXPath(xpath, { visible: true, timeout: 3000 })
    expect(element).not.toBe(null)

    if (expectDisabled) {
      // Check if the disable network button is now "Enable"
      const disableButtonText = await page.evaluate((selector) => {
        const buttonEleemnt = document.querySelector(selector)
        return buttonEleemnt ? buttonEleemnt.textContent.trim() : null
      }, SELECTORS.disableNetworkButton)

      expect(disableButtonText).toBe('Enable')
    }
  } else {
    const element = await page.waitForXPath(xpath, { hidden: true, timeout: 3000 })
    expect(element).toBe(null)
  }
}

async function selectNetwork(page, network_name) {
  const xpath = `//div[.//div[text()="Network details"]]//div[text()="${network_name}"]`
  await page.waitForXPath(xpath, { visible: true, timeout: 3000 })
  const [element] = await page.$x(xpath)
  expect(element).not.toBeNull()
  element.click()
}

export async function editNetwork(page, network_symbol) {
  await openSettingsPage(page)
  await selectSetting(page, 'Network', 'Network details')
  const network = NETWORKS_LIST[network_symbol]
  await selectNetwork(page, network.networkName)
  await verifyNetworkField(page, 'Block Explorer URL', network.explorerUrl)

  // Select Edit, chnage 'Block Explorer URL' and 'Cancel'
  await selectNetworkButton(page, 'Edit')
  const xpath = '//div[text()="Edit network"]'
  await page.waitForXPath(xpath, { visible: true, timeout: 2000 })
  await typeNetworkField(page, 'Block Explorer URL', '/')
  await selectManualNetworkButton(page, 'Cancel')
  await verifyNetworkField(page, 'Block Explorer URL', network.explorerUrl)

  // Select Edit, chnage 'Block Explorer URL' and 'Save'
  await selectNetworkButton(page, 'Edit')
  await page.waitForXPath(xpath, { visible: true, timeout: 2000 })
  await typeNetworkField(page, 'Block Explorer URL', '/')
  await selectManualNetworkButton(page, 'Save')
  await verifyGreenMessage(page, GREEN_MSG_NETWORK_SAVED)
  await verifyNetworkField(page, 'Block Explorer URL', `${network.explorerUrl}/`)
}

export async function disableNetwork(page, network_symbol) {
  await openSettingsPage(page)
  await selectSetting(page, 'Network', 'Network details')
  const network = NETWORKS_LIST[network_symbol]
  await selectNetwork(page, network.networkName)
  await verifyNetworkField(page, 'Network Name', network.networkName)
  await clickOnElement(page, SELECTORS.disableNetworkButton)
  await page.waitForSelector(SELECTORS.disableNetworkConfirmButton, {
    visible: true,
    timeout: 3000
  })
  await page.waitForTimeout(1500)
  await clickOnElement(page, SELECTORS.disableNetworkConfirmButton)
  await verifyNetwork(page, network.networkName, false, true)
}

async function openNewPage(page, callback = null) {
  const context = page.browserContext()

  const [newPagePromise] = await Promise.all([
    new Promise((resolve) => {
      context.once('targetcreated', async (target) => {
        const aPage = await target.page()
        resolve(aPage)
      })
    }),
    await callback(page)
  ])

  const newPage = await newPagePromise
  return newPage
}

export async function addNetworkFromChainlist(page, network_symbol) {
  await openSettingsPage(page)
  await selectSetting(page, 'Network', 'Network details')
  const network = NETWORKS_LIST[network_symbol]

  const chainlistTab = await openNewPage(page, (callback_page) =>
    clickOnElement(callback_page, SELECTORS.settingsAddNetworkFromChainlist)
  )

  await chainlistTab.waitForSelector(CHAINLIST_SEARCH_PLACEHOLDER, { timeout: 5000 })

  const [connectBtn] = await chainlistTab.$x(CONNECT_WALLET_BTN)
  const connectPage = await openNewPage(chainlistTab, () => {
    connectBtn?.click()
  })
  await connectPage.waitForSelector(SELECTORS.dappConnectButton, { visible: true, timeout: 5000 })
  await clickOnElement(connectPage, SELECTORS.dappConnectButton)

  await chainlistTab.waitForSelector(CHAINLIST_SEARCH_PLACEHOLDER, { timeout: 5000 })
  await typeText(chainlistTab, CHAINLIST_SEARCH_PLACEHOLDER, network.networkName)
  await chainlistTab.waitForXPath(`//span[contains(text(), '${network.networkName}')]`, {
    timeout: 5000
  })

  const selector = `//div[.//span[text()='${network.networkName}']]//button[normalize-space()='Add to Metamask']`
  await chainlistTab.waitForXPath(selector, { timeout: 5000 })
  const [addBtn] = await chainlistTab.$x(selector)
  const addNetworkPage = await openNewPage(chainlistTab, () => {
    addBtn?.click()
  })
  await addNetworkPage.waitForXPath(AMBIRE_SMART_ACCOUNTS_MSG, { hidden: true, timeout: 3000 })
  await addNetworkPage.waitForSelector('text=Add network', { visible: true, timeout: 3000 })
  await page.waitForTimeout(2000)
  await clickOnElement(addNetworkPage, 'text=Add network')

  await chainlistTab.waitForSelector(CHAINLIST_SEARCH_PLACEHOLDER, { timeout: 5000 })
  await chainlistTab.close()

  await verifyNetwork(page, network.networkName, true)
}
