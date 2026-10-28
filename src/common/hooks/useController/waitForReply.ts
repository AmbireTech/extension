import { v4 as uuidv4 } from 'uuid'

import eventBus from '@common/services/event/eventBus'

/**
 * The controller didn't reply in time. It may still be working on the call, unlike when it
 * replies with an error.
 */
export class ReplyTimeoutError extends Error {}

/**
 * Sends a request with a fresh request id and resolves with the controller's reply to it
 * (`receiveOneTimeData` with that id), or rejects with its error or once `timeoutMs` passes.
 * `label` names the call in the errors.
 */
export const waitForReply = <R = any>(
  label: string,
  timeoutMs: number,
  send: (requestId: string) => void
) => {
  const requestId = uuidv4()

  return new Promise<R>((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      eventBus.removeEventListener('receiveOneTimeData', onResponse)
      clearTimeout(timeoutId)
    }

    const onResponse = (data: any) => {
      if (data?.requestId !== requestId) return
      if (settled) return

      settled = true

      cleanup()

      if (data.ok) {
        resolve(data.res as R)
      } else {
        reject(new Error(data.error ?? `Calling ${label} failed`))
      }
    }

    const timeoutId = setTimeout(() => {
      if (settled) return
      settled = true

      cleanup()
      reject(new ReplyTimeoutError(`Calling ${label} timed out after ${timeoutMs / 1000} seconds`))
    }, timeoutMs)

    // Listen before sending: on mobile the controllers run in this realm and
    // can reply synchronously, before a listener added afterwards would exist
    eventBus.addEventListener('receiveOneTimeData', onResponse)
    send(requestId)
  })
}
