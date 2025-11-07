import { CallbackFunction, ReplyMessage, SendMessage } from '@ambire-common/interfaces/messenger'
import { createMessenger } from '@web/extension-services/messengers/internal/createMessenger'
import { isValidReply } from '@web/extension-services/messengers/internal/isValidReply'
import { isValidSend } from '@web/extension-services/messengers/internal/isValidSend'

declare const globalIsAmbireNext: boolean

/**
 * Send a message to either a specific tab or to the runtime. Needed since we
 * want to communicate between different parts of the extension,
 * like between a content script and the background script.
 */
function sendMessage<TPayload>(message: SendMessage<TPayload>, { tabId }: { tabId?: number } = {}) {
  if (typeof tabId === 'undefined') return chrome?.runtime?.sendMessage?.(message)

  return chrome.tabs?.sendMessage?.(tabId, message)
}

/**
 * Creates a "tab messenger" that can be used to communicate between
 * scripts where `chrome.tabs` & `chrome.runtime` is defined.
 *
 * Compatible connections:
 * - ❌ Background <-> Inpage
 * - ✅ Background <-> Content Script
 * - ❌ Content Script <-> Inpage
 */
export const tabMessenger = createMessenger({
  available: Boolean(typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.tabs),
  name: 'tabMessenger',
  async send<TPayload, TResponse>(
    topic: string,
    payload: TPayload,
    { id, tabId }: { id?: number | string; tabId?: number } = {}
  ) {
    if (topic.includes(globalIsAmbireNext ? 'broadcast-next' : 'broadcast')) {
      sendMessage({ topic: `> ${topic}`, payload, id }, { tabId })
      return Promise.resolve(null) as any
    }

    return new Promise<TResponse>((resolve, reject) => {
      const listener = (
        message: ReplyMessage<TResponse>,
        _: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void
      ) => {
        if (!isValidReply<TResponse>({ id, message, topic })) return

        chrome.runtime.onMessage?.removeListener(listener)

        const { response: r, error } = message.payload
        if (error) reject(new Error(error.message))
        resolve(r)
        sendResponse({})
        return true
      }
      chrome.runtime.onMessage?.addListener(listener)

      sendMessage({ topic: `> ${topic}`, payload, id }, { tabId })
    })
  },
  reply<TPayload, TResponse>(topic: string, callback: CallbackFunction<TPayload, TResponse>) {
    const listener = async (
      message: SendMessage<TPayload>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!isValidSend({ message, topic })) return

      if (topic.includes(globalIsAmbireNext ? 'broadcast-next' : 'broadcast')) {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        callback(message.payload, {
          id: message.id,
          sender,
          topic: message.topic
        })
        return
      }
      const repliedTopic = message.topic.replace('>', '<')

      try {
        const response = await callback(message.payload, {
          id: message.id,
          sender,
          topic: message.topic
        })
        sendMessage(
          {
            topic: repliedTopic,
            payload: { response },
            id: message.id
          },
          { tabId: sender.tab?.id }
        )
      } catch (error_) {
        // Errors do not serialize properly over `chrome.runtime.sendMessage`, so
        // we are manually serializing it to an object.
        const error: Record<string, unknown> = {}
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.getOwnPropertyNames(error_)) {
          error[key] = (<Error>error_)[<keyof Error>key]
        }
        sendMessage(
          {
            topic: repliedTopic,
            payload: { error },
            id: message.id
          },
          {
            tabId: sender.tab?.id
          }
        )
      }
      sendResponse({})
      return true
    }
    chrome.runtime.onMessage?.addListener(listener)
    return () => chrome.runtime.onMessage?.removeListener(listener)
  }
})
