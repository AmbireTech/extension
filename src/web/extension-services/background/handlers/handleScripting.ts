/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { browser, engine, getFirefoxVersion } from '@web/constants/browserapi'

const CONTENT_SCRIPT_EXCLUDE_MATCHES = [
  '*://doInWebPack.lan/*',
  // Keep the exact Connect host for the legacy Trezor popup and the wildcard for other
  // Trezor-owned Suite/Connect pages. Ambire provider scripts are not needed there.
  'https://connect.trezor.io/*',
  'https://*.trezor.io/*'
]

const CONTENT_SCRIPT_IDS = [
  'content-script-messenger-bridge',
  'ambire-inpage',
  'ethereum-inpage',
  'content-script-ambire-injection',
  'content-script-ethereum-injection'
]

const handleRegisterScripts = async () => {
  const scripts: {
    id: string
    allFrames?: boolean
    css?: string[]
    excludeMatches?: string[]
    js?: string[]
    matches?: string[]
    persistAcrossSessions?: boolean
    runAt?: 'document_start' | 'document_end' | 'document_idle'
    world?: 'ISOLATED' | 'MAIN'
  }[] = []

  const registeredScripts = await browser.scripting.getRegisteredContentScripts()
  const scriptsMissingTrezorExcludes = registeredScripts
    .filter(
      (s: any) =>
        CONTENT_SCRIPT_IDS.includes(s.id) &&
        !CONTENT_SCRIPT_EXCLUDE_MATCHES.every((match) => s.excludeMatches?.includes(match))
    )
    .map((s: any) => s.id)

  if (scriptsMissingTrezorExcludes.length) {
    await browser.scripting.unregisterContentScripts({ ids: scriptsMissingTrezorExcludes })
  }

  const isRegistered = (id: string) =>
    registeredScripts.some((s: any) => s.id === id && !scriptsMissingTrezorExcludes.includes(id))

  const registeredContentScriptMessengerBridge = registeredScripts.find(
    (s: any) => s.id === 'content-script-messenger-bridge' && isRegistered(s.id)
  )

  if (!registeredContentScriptMessengerBridge) {
    scripts.push({
      id: 'content-script-messenger-bridge',
      allFrames: true,
      matches: ['http://*/*', 'https://*/*', 'file://*/*'],
      excludeMatches: CONTENT_SCRIPT_EXCLUDE_MATCHES,
      js: ['browser-polyfill.min.js', 'content-script.js'],
      runAt: 'document_start'
    })
  }

  const firefoxVersion = getFirefoxVersion()

  // Firefox versions older than 128.0 do not support world: MAIN.
  // We handle this using dynamic scripting by injecting:
  // 1. A script with world: MAIN for versions 128.0 or higher.
  // 2. A content script that injects the ambire-inpage and ethereum-inpage scripts into the document for older versions
  const shouldUseWorldMain = engine === 'webkit' || (firefoxVersion && firefoxVersion >= 128)

  if (shouldUseWorldMain) {
    const registeredAmbireInpage = registeredScripts.find(
      (s: any) => s.id === 'ambire-inpage' && isRegistered(s.id)
    )
    const registeredEthereumInpage = registeredScripts.find(
      (s: any) => s.id === 'ethereum-inpage' && isRegistered(s.id)
    )
    if (!registeredAmbireInpage) {
      scripts.push({
        id: 'ambire-inpage',
        matches: ['http://*/*', 'https://*/*', 'file://*/*'],
        excludeMatches: CONTENT_SCRIPT_EXCLUDE_MATCHES,
        js: ['ambire-inpage.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true
      })
    }
    if (!registeredEthereumInpage) {
      scripts.push({
        id: 'ethereum-inpage',
        matches: ['http://*/*', 'https://*/*', 'file://*/*'],
        excludeMatches: CONTENT_SCRIPT_EXCLUDE_MATCHES,
        js: ['ethereum-inpage.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true
      })
    }
  } else {
    const registeredContentScriptAmbireInjection = registeredScripts.find(
      (s: any) => s.id === 'content-script-ambire-injection' && isRegistered(s.id)
    )
    const registeredContentScriptEthereumInjection = registeredScripts.find(
      (s: any) => s.id === 'content-script-ethereum-injection' && isRegistered(s.id)
    )
    if (!registeredContentScriptAmbireInjection) {
      scripts.push({
        id: 'content-script-ambire-injection',
        allFrames: true,
        matches: ['http://*/*', 'https://*/*', 'file://*/*'],
        excludeMatches: CONTENT_SCRIPT_EXCLUDE_MATCHES,
        js: ['content-script-ambire-injection.js'],
        runAt: 'document_start'
      })
    }
    if (!registeredContentScriptEthereumInjection) {
      scripts.push({
        id: 'content-script-ethereum-injection',
        allFrames: true,
        matches: ['http://*/*', 'https://*/*', 'file://*/*'],
        excludeMatches: CONTENT_SCRIPT_EXCLUDE_MATCHES,
        js: ['content-script-ethereum-injection.js'],
        persistAcrossSessions: false,
        runAt: 'document_start'
      })
    }
  }

  try {
    if (scripts.length) {
      await browser.scripting.registerContentScripts(scripts)
    }
  } catch (err) {
    console.warn(`Failed to inject EthereumProvider: ${err}`)
  }
}

let executeContentScriptForTabsFromPrevSessionPromise: Promise<void> | undefined

const executeContentScriptForTabsFromPrevSession = async (tab: chrome.tabs.Tab) => {
  if (!tab.id || !tab.url) return

  if (!['http://', 'https://', 'file://'].some((prefix) => tab.url!.startsWith(prefix))) return

  await executeContentScriptForTabsFromPrevSessionPromise

  try {
    await browser.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['browser-polyfill.min.js', 'content-script.js'],
      injectImmediately: true
    })
  } catch (error) {
    console.error(error)
  } finally {
    executeContentScriptForTabsFromPrevSessionPromise = undefined
  }
}

// This mechanism keeps the content script used for communication between dApps and extension
// up to date across the sessions of the extension and when the service worker/background script
// goes inactive and then reactivates
const handleKeepBridgeContentScriptAcrossSessions = () => {
  browser.tabs.onActivated.addListener(async ({ tabId }: chrome.tabs.TabActiveInfo) => {
    const tab = await browser.tabs.get(tabId)
    executeContentScriptForTabsFromPrevSessionPromise =
      executeContentScriptForTabsFromPrevSession(tab)
    await executeContentScriptForTabsFromPrevSessionPromise
  })

  browser.tabs
    .query({ active: true, currentWindow: true })
    .then(async (tabs: chrome.tabs.Tab[]) => {
      for (const tab of tabs) {
        executeContentScriptForTabsFromPrevSessionPromise =
          executeContentScriptForTabsFromPrevSession(tab)
        await executeContentScriptForTabsFromPrevSessionPromise
      }
    })
}

export { handleRegisterScripts, handleKeepBridgeContentScriptAcrossSessions }
