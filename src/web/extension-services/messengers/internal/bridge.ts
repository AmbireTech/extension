import { detectScriptType } from '../utils/detectScriptType'
import { createMessenger } from './createMessenger'
import { tabMessenger } from './tab'
import { windowMessenger } from './window'

const messenger = tabMessenger.available ? tabMessenger : windowMessenger

/**
 * Creates a "bridge messenger" that can be used to communicate between
 * scripts where there isn't a direct messaging connection (ie. inpage <-> background).
 *
 * Compatible connections:
 * - ✅ Popup <-> Inpage
 * - ✅ Background <-> Inpage
 * - ❌ Background <-> Popup
 * - ❌ Popup <-> Content Script
 * - ❌ Background <-> Content Script
 * - ❌ Content Script <-> Inpage
 */
export const bridgeMessenger = createMessenger({
  available: messenger.available,
  name: 'bridgeMessenger',
  async send(topic, payload, { id } = {}) {
    return messenger.send(topic, payload, { id })
  },
  reply(topic, callback) {
    return messenger.reply(topic, callback)
  }
})

export function setupBridgeMessengerRelay() {
  if (detectScriptType() !== 'contentScript') {
    throw new Error('`setupBridgeMessengerRelay` is only supported in Content Scripts.')
  }

  // e.g. inpage -> content script -> background
  windowMessenger.reply<unknown, unknown>('*', async (payload, { topic, id }) => {
    if (!topic) return

    const t = topic.replace('> ', '')
    const response = await tabMessenger.send<unknown, unknown>(t, payload, { id })
    return response
  })

  // e.g. background -> content script -> inpage
  tabMessenger.reply<unknown, unknown>('*', async (payload, { topic, id }) => {
    if (!topic) return

    const t: string = topic.replace('> ', '')
    const response = await windowMessenger.send<unknown, unknown>(t, payload, { id })
    return response
  })
}
