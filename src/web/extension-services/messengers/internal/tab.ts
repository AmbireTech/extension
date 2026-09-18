import { CallbackFunction, ReplyMessage, SendMessage } from '@ambire-common/interfaces/messenger'
import { logInfoWithPrefix } from '@common/utils/logger'
import { createMessenger } from '@web/extension-services/messengers/internal/createMessenger'
import { isValidReply } from '@web/extension-services/messengers/internal/isValidReply'
import { isValidSend } from '@web/extension-services/messengers/internal/isValidSend'

declare const globalIsAmbireNext: boolean

/**
 * Send a message to either a specific tab or to the runtime. Needed since we
 * want to communicate between different parts of the extension,
 * like between a content script and the background script.
 */
function sendMessage<TPayload>(
  message: SendMessage<TPayload>,
  { tabId, frameId, documentId }: { tabId?: number; frameId?: number; documentId?: string } = {}
) {
  if (typeof tabId === 'undefined') return chrome?.runtime?.sendMessage?.(message)

  // SECURITY: target the exact document/frame that sent the request so replies
  // never leak to other frames in the tab (broadcasts pass neither, stay tab-wide).
  const options: { frameId?: number; documentId?: string } = {}
  if (typeof documentId === 'string') options.documentId = documentId
  else if (typeof frameId === 'number') options.frameId = frameId

  return chrome.tabs?.sendMessage?.(tabId, message, options)
}

/**
 * The messages Chrome rejects with when the tab, window or extension page we are
 * addressing has already gone away.
 */
const TARGET_GONE_ERROR_SUBSTRINGS = [
  'Receiving end does not exist',
  'No tab with id',
  'No window with id'
]

const isTargetGoneError = (error: unknown) =>
  error instanceof Error &&
  TARGET_GONE_ERROR_SUBSTRINGS.some((substring) => error.message.includes(substring))

/**
 * Sends a message and reports whether it reached its target. Resolves to false when the
 * target was already gone, which is expected here and only gets logged. Every other
 * failure rejects, so a genuine messaging bug still surfaces.
 */
async function sendMessageToTarget<TPayload>(
  message: SendMessage<TPayload>,
  options: { tabId?: number; frameId?: number; documentId?: string } = {}
): Promise<boolean> {
  try {
    await sendMessage(message, options)
    return true
  } catch (error) {
    if (!isTargetGoneError(error)) throw error

    logInfoWithPrefix(
      'tabMessenger',
      `dropped "${message.topic}" because the target is gone`,
      error
    )
    return false
  }
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
      await sendMessageToTarget({ topic: `> ${topic}`, payload, id }, { tabId })
      return null as any
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

      // A target that is already gone will never reply, so the listener has to be
      // removed here instead - otherwise it stays registered in the long-lived
      // background for the rest of the session and this promise never settles.
      sendMessageToTarget({ topic: `> ${topic}`, payload, id }, { tabId }).then(
        (wasDelivered) => {
          if (wasDelivered) return

          chrome.runtime.onMessage?.removeListener(listener)
          resolve(null as TResponse)
        },
        (error) => {
          chrome.runtime.onMessage?.removeListener(listener)
          reject(error)
        }
      )
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

      // documentId is present at runtime on modern browsers but not in the
      // installed chrome type defs; read it via a narrow local cast.
      const senderDocumentId = (sender as chrome.runtime.MessageSender & { documentId?: string })
        .documentId

      let replyPayload: { response: TResponse } | { error: Record<string, unknown> }
      try {
        replyPayload = {
          response: await callback(message.payload, {
            id: message.id,
            sender,
            topic: message.topic
          })
        }
      } catch (error_) {
        // Errors do not serialize properly over `chrome.runtime.sendMessage`, so
        // we are manually serializing it to an object.
        const error: Record<string, unknown> = {}

        for (const key of Object.getOwnPropertyNames(error_)) {
          error[key] = (<Error>error_)[<keyof Error>key]
        }
        replyPayload = { error }
      }

      await sendMessageToTarget(
        {
          topic: repliedTopic,
          payload: replyPayload,
          id: message.id
        },
        { tabId: sender.tab?.id, frameId: sender.frameId, documentId: senderDocumentId }
      )

      sendResponse({})
      return true
    }
    chrome.runtime.onMessage?.addListener(listener)
    return () => chrome.runtime.onMessage?.removeListener(listener)
  }
})
