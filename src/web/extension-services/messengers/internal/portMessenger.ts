/* eslint-disable @typescript-eslint/no-floating-promises */
import { stringify } from '@ambire-common/libs/richJson/richJson'
import { Action, MethodAction } from '@common/types/actions'
import { browser } from '@web/constants/browserapi'

import { deserializeMessagePart, detectStructuredCloneSupport } from './messageSerialization'

export type Port = chrome.runtime.Port & { id: string; name: 'popup' | 'tab' | 'request-window' }

type MessageType = '> ui' | '> ui-error' | '> ui-toast' | '> background'

export type MessageMeta = { windowId?: number; [key: string]: any }

export type SendType = <TMessageType extends MessageType>(
  type: MessageType,
  message: TMessageType extends '> background' ? MethodAction | Action : PortMessageType,
  meta?: MessageMeta
) => void

export type SendPortType = <TMessageType extends MessageType>(
  port: Port,
  type: MessageType,
  message: TMessageType extends '> background' ? MethodAction | Action : PortMessageType,
  meta?: MessageMeta
) => void

type ListenCallbackType = <TMessageType extends MessageType>(
  type: MessageType,
  message: TMessageType extends '> background' ? MethodAction | Action : PortMessageType,
  meta?: MessageMeta
) => Promise<any> | void

export type PortMessageType = {
  method: string
  params: any
  forceEmit?: boolean
}

// Whether the browser supports structured clone for port messages. This is probed once on the first message
// send and cached for subsequent sends.
let structuredCloneSupport: boolean | null = null

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

  #portListeners = new Map<string, (data: any) => void>()

  #portDisconnectListeners = new Map<string, (data: any) => void>()

  constructor(ports: Port[] = []) {
    this.ports = ports
  }

  addOrUpdatePort(port: Port, onPortAddOrUpdate: (port: Port) => void) {
    this.ports = this.ports.filter((p) => p.id !== port.id)
    this.ports.push(port)
    onPortAddOrUpdate(port)
  }

  connect = (port?: { id: string; name: string }) => {
    const { id, name } = port ?? {}

    if (!id && !name) return

    if (this.ports[0]) {
      this.#removePort(this.ports[0])
      this.ports[0].disconnect()
    }

    this.ports[0] = browser.runtime.connect(undefined, name ? { name: `${name}:${id}` } : undefined)
    if (id) this.ports[0].id = id
    if (name) this.ports[0].name = name as Port['name']
  }

  addConnectListener(portId: string, callback: ListenCallbackType) {
    const port = this.ports.find((p) => p.id === portId)
    if (!port) return

    // If a listener already exists for this portId, remove the old one first
    const oldListener = this.#portListeners.get(portId)
    if (oldListener) {
      const oldPort = this.ports.find((p) => p.id === portId)
      if (oldPort) oldPort.onMessage.removeListener(oldListener)
      this.#portListeners.delete(portId)
    }

    const listener = (data: any) => {
      if (!data.messageType || !data.message) return
      const message = deserializeMessagePart(data.message)
      const meta = data.meta ? deserializeMessagePart(data.meta) : {}
      callback(data.messageType, message, meta)
    }

    port.onMessage.addListener(listener)
    this.#portListeners.set(portId, listener)
  }

  addDisconnectListener(portId: string, callback: (p: chrome.runtime.Port) => void) {
    const port = this.ports.find((p) => p.id === portId)
    if (!port) return

    // If a listener already exists for this portId, remove the old one first
    const oldListener = this.#portDisconnectListeners.get(portId)
    if (oldListener) {
      const oldPort = this.ports.find((p) => p.id === portId)
      if (oldPort) oldPort.onDisconnect.removeListener(oldListener)
      this.#portDisconnectListeners.delete(portId)
    }

    const listener = (p: chrome.runtime.Port) => {
      this.#removePort(port)
      callback(p)
    }

    port.onDisconnect.addListener(listener)
    this.#portDisconnectListeners.set(portId, listener)
  }

  // sends a message to all ports
  send: SendType = (type, message, meta = {}) => {
    const [probePort] = this.ports
    if (!probePort) return

    const useStructuredClone = this.#supportsStructuredClone(probePort)
    this.ports.forEach((port) => {
      this.#postMessage(port, useStructuredClone, type, message, meta)
    })
  }

  // sends a message to a specific port
  sendToPort: SendPortType = (port, type, message, meta = {}) => {
    this.#postMessage(port, this.#supportsStructuredClone(port), type, message, meta)
  }

  // Probes structured clone support once (see messageSerialization.ts) and
  // caches it. The probe posts an inert message on the given port.
  #supportsStructuredClone(probePort: chrome.runtime.Port): boolean {
    if (structuredCloneSupport === null) {
      structuredCloneSupport = detectStructuredCloneSupport((msg) => probePort.postMessage(msg))
    }
    return structuredCloneSupport
  }

  #postMessage(
    port: chrome.runtime.Port,
    useStructuredClone: boolean,
    type: MessageType,
    message: any,
    meta: MessageMeta
  ) {
    if (useStructuredClone) {
      try {
        port.postMessage({ messageType: type, message, meta })
        return
      } catch (error) {
        console.error('Structured clone postMessage failed, falling back to richJson', error)
      }
    }

    try {
      port.postMessage({ messageType: type, message: stringify(message), meta: stringify(meta) })
    } catch (error) {
      console.error('Error in port.postMessage', error)
    }
  }

  #removePort(port: Port) {
    this.ports = this.ports.filter((p) => p.id !== port.id)
    const listener = this.#portListeners.get(port.id)

    if (!port) return

    if (listener) {
      port.onMessage.removeListener(listener)
      this.#portListeners.delete(port.id)
    }

    const disconnectListener = this.#portDisconnectListeners.get(port.id)

    if (disconnectListener) {
      port.onDisconnect.removeListener(disconnectListener)
      this.#portDisconnectListeners.delete(port.id)
    }
  }
}
