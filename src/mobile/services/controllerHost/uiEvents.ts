import eventBus from '@common/services/event/eventBus'

/**
 * The controllers' only channel to the UI. Everything here used to be a
 * `sendToReactEvent` message crossing the WebView bridge; now that the
 * controllers run in the same realm it is a plain eventBus emit, but the event
 * names and payload shapes are unchanged so every existing listener keeps working.
 */

export const emitCtrlUpdate = (ctrlName: string, state: any, forceEmit?: boolean) => {
  eventBus.emit('ctrlUpdate', { ctrlName, ctrlState: state, forceEmit })
}

export const emitCtrlError = (ctrlName: string, errors: any[]) => {
  eventBus.emit('error', { errors, controller: ctrlName })
}

export const emitToast = (text: string, options: any) => {
  eventBus.emit('addToast', { text, options })
}

export const emitOneTimeData = (params: any) => {
  eventBus.emit('receiveOneTimeData', params)
}

export const emitNavigate = (route: string, params: any) => {
  eventBus.emit('navigate', { route, params })
}

export const emitToDappWebView = (payload: {
  result: any
  error: any
  requestId: any
  providerId: any
  topic: any
}) => {
  eventBus.emit('action.sendToDappWebView', payload)
}

export const emitDappEventBroadcast = (payload: any) => {
  eventBus.emit('action.broadcastDappEvent', payload)
}

/**
 * Asks the RN layer to open, focus or close the request window and resolves once
 * the animation has finished, which is what the chrome.windows.* calls this
 * mirrors do on the extension.
 */
export const requestWindowAction = (payload: {
  type: 'open' | 'focus' | 'remove'
  winId: number
}) =>
  new Promise<void>((resolve) => {
    eventBus.emit('ui.window.action', { ...payload, resolve })
  })
