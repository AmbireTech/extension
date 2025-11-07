/* eslint-disable @typescript-eslint/no-floating-promises */

import { createMessenger } from '@web/extension-services/messengers/internal/createMessenger'
import { tabMessenger } from '@web/extension-services/messengers/internal/tab'
import { windowMessenger } from '@web/extension-services/messengers/internal/window'
import { detectScriptType } from '@web/extension-services/messengers/utils/detectScriptType'

declare const globalIsAmbireNext: boolean

const messenger = tabMessenger.available ? tabMessenger : windowMessenger
const scriptId = Date.now()

/**
 * Creates a "bridge messenger" that can be used to communicate between
 * scripts where there isn't a direct messaging connection (ie. inpage <-> background).
 *
 * Compatible connections:
 * - ✅ Background <-> Inpage
 * - ❌ Background <-> Content Script
 * - ❌ Content Script <-> Inpage
 */

export const bridgeMessenger = createMessenger({
  available: messenger.available,
  name: 'bridgeMessenger',
  async send(topic, payload, options) {
    return messenger.send(topic, payload, options || {})
  },
  reply(topic, callback) {
    return messenger.reply(topic, callback)
  }
})

export async function setupBridgeMessengerRelay() {
  if (detectScriptType() !== 'contentScript') {
    throw new Error('`setupBridgeMessengerRelay` is only supported in Content Scripts.')
  }

  window.postMessage(
    { type: globalIsAmbireNext ? 'removeEventListenerNext' : 'removeEventListener', scriptId },
    '*'
  )

  let windowReplyListener: (() => void) | undefined
  let tabReplyListener: (() => void) | undefined

  const handleDestroy = (e: MessageEvent<any>) => {
    // the id here prevents destroying the current script that sends the `removeEventListener` message
    if (
      e.data?.type === (globalIsAmbireNext ? 'removeEventListenerNext' : 'removeEventListener') &&
      e.data?.scriptId > scriptId
    ) {
      !!windowReplyListener && windowReplyListener()
      windowReplyListener = undefined
      !!tabReplyListener && tabReplyListener()
      tabReplyListener = undefined
      window.removeEventListener('message', handleDestroy)
    }
  }

  window.addEventListener('message', handleDestroy)

  // e.g. inpage -> content script -> background
  windowReplyListener = windowMessenger.reply('*', async (payload, { topic, id }) => {
    if (!topic) return

    // chrome.runtime.id will be defined only if the content script
    // is registered from the current service worker or background script session
    if (!chrome?.runtime?.id) {
      // calling this func clears the window reply listener
      !!windowReplyListener && windowReplyListener()
      windowReplyListener = undefined
      // avoid returning here to prevent sending an incorrect response to the inpage from this content script
    } else {
      const t = topic.replace('> ', '')
      const response: any = await tabMessenger.send(t, payload, { id })

      return response
    }
  })

  // e.g. background -> content script -> inpage
  tabReplyListener = tabMessenger.reply('*', async (payload, { topic, id }) => {
    if (!topic) return

    // chrome.runtime.id will be defined only if the content script
    // is registered from the current service worker or background script session
    if (!chrome?.runtime?.id) {
      // calling this func clears the tab reply listener
      !!tabReplyListener && tabReplyListener()
      tabReplyListener = undefined
      // avoid returning here to prevent sending an incorrect response to the background from this content script
    } else {
      const t = topic.replace('> ', '')
      const response = await windowMessenger.send(t, payload, { id })

      return response
    }
  })

  // next tick
  setTimeout(() => {
    // Notify the background that the content script is ready to receive messages
    tabMessenger.send(
      globalIsAmbireNext ? 'ambireNextBuildProviderRequest' : 'ambireProviderRequest',
      { id: 0, method: 'contentScriptReady' },
      { id: 0 }
    )
  }, 0)
}
