/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-shadow */
// @ts-nocheck

import { _fetchData, toUtf8Bytes, toUtf8String } from 'ethers/lib/utils'

// eslint-disable-next-line import/no-extraneous-dependencies
import { deepCopy, shallowCopy } from '@ethersproject/properties'
import { JsonRpcProvider } from '@ethersproject/providers'

function getResult(payload: {
  error?: { code?: number; data?: any; message?: string }
  result?: any
}): any {
  if (payload.error) {
    // @TODO: not any
    const error: any = new Error(payload.error.message)
    error.code = payload.error.code
    error.data = payload.error.data
    throw error
  }

  return payload.result
}

export function fetchJson({
  connection,
  json,
  processFunc,
  origin
}: {
  connection: any
  json?: string
  processFunc?: (value: any, response: any) => any
  origin: string
}): Promise<any> {
  const processJsonFunc = (value: Uint8Array, response: any) => {
    let result: any = null
    if (value != null) {
      try {
        result = JSON.parse(toUtf8String(value))
      } catch (error) {
        console.error('invalid JSON', {
          body: value,
          error
        })
      }
    }

    if (processFunc) {
      result = processFunc(result, response)
    }

    return result
  }

  // If we have json to send, we must
  // - add content-type of application/json (unless already overridden)
  // - convert the json to bytes
  let body: Uint8Array = null
  if (json != null) {
    body = toUtf8Bytes(json)

    // Create a connection with the content-type set for JSON
    const updated = typeof connection === 'string' ? { url: connection } : shallowCopy(connection)
    if (updated.headers) {
      const hasContentType =
        Object.keys(updated.headers).filter((k) => k.toLowerCase() === 'content-type').length !== 0
      if (!hasContentType) {
        updated.headers = shallowCopy(updated.headers)
        updated.headers['content-type'] = 'application/json'
        updated.headers.Origin = origin
      }
    } else {
      updated.headers = { 'content-type': 'application/json', Origin: origin }
    }

    connection = updated
  }

  return _fetchData<any>(connection, body, processJsonFunc)
}

/**
 * Extends the default JsonRpcProvider by giving us option to customize the origin header
 */

class CustomJsonRpcProvider extends JsonRpcProvider {
  origin: string = ''

  url: string = ''

  constructor(url: { url: string; origin: string }, network: any) {
    let networkOrReady = network

    // The network is unknown, query the JSON-RPC for it
    if (networkOrReady == null) {
      networkOrReady = new Promise((resolve, reject) => {
        setTimeout(() => {
          this.detectNetwork().then(
            (network) => {
              resolve(network)
            },
            (error) => {
              reject(error)
            }
          )
        }, 0)
      })
    }

    super()

    this.origin = url.origin
    this.url = url.url
  }

  send(method: string, params: Array<any>): Promise<any> {
    const request = {
      method,
      params,
      id: this._nextId++,
      jsonrpc: '2.0'
    }

    this.emit('debug', {
      action: 'request',
      request: deepCopy(request),
      provider: this
    })

    // We can expand this in the future to any call, but for now these
    // are the biggest wins and do not require any serializing parameters.
    const cache = ['eth_chainId', 'eth_blockNumber'].indexOf(method) >= 0
    if (cache && this._cache[method]) {
      return this._cache[method]
    }

    const result = fetchJson({
      connection: this.url,
      json: JSON.stringify(request),
      processFunc: getResult,
      origin: this.origin
    }).then(
      (result) => {
        this.emit('debug', {
          action: 'response',
          request,
          response: result,
          provider: this
        })

        return result
      },
      (error) => {
        this.emit('debug', {
          action: 'response',
          error,
          request,
          provider: this
        })
        throw error
      }
    )

    // Cache the fetch, but clear it on the next event loop
    if (cache) {
      this._cache[method] = result
      setTimeout(() => {
        this._cache[method] = null
      }, 0)
    }

    return result
  }
}

export default CustomJsonRpcProvider
