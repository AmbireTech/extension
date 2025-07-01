/* eslint-disable @typescript-eslint/no-floating-promises */
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { browser } from '@web/constants/browserapi'
import { Action as ActionType } from '@web/extension-services/background/actions'

export type Port = chrome.runtime.Port & { id: string }

type MessageType = '> ui' | '> ui-error' | '> ui-toast' | '> background'

export type MessageMeta = { windowId?: number; [key: string]: any }

export type SendType = <TMessageType extends MessageType>(
  type: MessageType,
  message: TMessageType extends '> background' ? ActionType : PortMessageType,
  meta?: MessageMeta
) => void

type ListenCallbackType = <TMessageType extends MessageType>(
  type: MessageType,
  message: TMessageType extends '> background' ? ActionType : PortMessageType,
  meta?: MessageMeta
) => Promise<any> | void

export type PortMessageType = {
  method: string
  params: any
  forceEmit?: boolean
}

/**
 * Creates a "port messenger" that can be used for communication between ui <-> background.
 *
 * Compatible connections:
 * - ❌ Background <-> Inpage
 * - ✅ UI <-> Background
 * - ❌ Background <-> Content Script
 * - ❌ Content Script <-> Inpage
 */

export class PortMessenger {
  ports: Port[] = []

  constructor(ports: Port[] = []) {
    this.ports = ports
  }

  addPort(port: Port) {
    this.ports = [...this.ports, port]
    this.send('> ui', { method: 'portReady', params: {} })
  }

  removePort(portId: string) {
    this.ports = this.ports.filter((port) => port.id !== portId)
  }

  connect = (name?: string) => {
    this.ports[0] = browser.runtime.connect(undefined, name ? { name } : undefined)
  }

  addListener(portId: string, callback: ListenCallbackType) {
    const port = this.ports.find((p) => p.id === portId)
    if (!port) return

    port.onMessage.addListener((data) => {
      if (!data.messageType || !data.message) return

      const message = parse(data.message)

      let meta = {}
      if (data.meta) meta = parse(data.meta)

      callback(data.messageType, message, meta)
    })
  }

  send: SendType = (type, message, meta = {}) => {
    if (!this.ports.length) return

    try {
      this.ports.forEach((port) => {
        port.postMessage({ messageType: type, message: stringify(message), meta: stringify(meta) })
      })
    } catch (error) {
      console.error('Error in port.postMessage', error)
    }
  }

  dispose(portId: string) {
    const port = this.ports.find((p) => p.id === portId)
    if (port) port.disconnect()
  }

  disposeAll() {
    if (!this.ports.length) return

    this.ports.forEach((port) => {
      port.disconnect()
    })
    this.ports = []
  }
}
