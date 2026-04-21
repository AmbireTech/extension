import {
  CustomResponse,
  Fetch,
  RequestInitWithCustomHeaders
} from '@ambire-common/interfaces/fetch'

type FetchInput = Parameters<Fetch>[0]

/**
 * Bridged Fetch — proxies all network requests through the React Native bridge.
 *
 * Instead of the WebView making HTTP requests directly (which requires insecure
 * flags like allowFileAccessFromFileURLs and allowUniversalAccessFromFileURLs),
 * this module serializes fetch calls and sends them to React Native via postMessage.
 * RN performs the actual network request using its native fetch and sends the
 * serialized response back.
 *
 * This follows the same async bridge pattern used for storage and crypto delegation.
 */

/** Minimal Response-like class that satisfies the ambire-common Fetch type contract */
class BridgedResponse {
  readonly status: number

  readonly statusText: string

  readonly ok: boolean

  readonly headers: any

  readonly url: string

  readonly redirected: boolean

  readonly type: ResponseType

  readonly body: any = null

  readonly size: number = 0

  readonly timeout: number = 0

  private _bodyText: string

  private _buffer?: Promise<any>

  private _bodyUsed: boolean = false

  constructor(data: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: string
    url: string
  }) {
    this.status = data.status
    this.statusText = data.statusText
    this.ok = data.status >= 200 && data.status < 300
    this.url = data.url
    this.redirected = false
    this.type = 'basic'
    this._bodyText = data.body

    // Reconstruct Headers object
    const h = new Headers() as Headers & { raw(): Record<string, string[]> }
    if (data.headers) {
      Object.entries(data.headers).forEach(([key, value]) => {
        h.set(key, value)
      })
    }
    h.raw = () => {
      const result: Record<string, string[]> = {}
      h.forEach((value, key) => {
        result[key] = [value]
      })
      return result
    }
    this.headers = h as any
  }

  get bodyUsed(): boolean {
    return this._bodyUsed
  }

  async text(): Promise<string> {
    this._bodyUsed = true
    return this._bodyText
  }

  async json(): Promise<any> {
    this._bodyUsed = true
    return JSON.parse(this._bodyText)
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    this._bodyUsed = true
    const encoder = new TextEncoder()
    return encoder.encode(this._bodyText).buffer
  }

  async blob(): Promise<Blob> {
    this._bodyUsed = true
    return new Blob([this._bodyText])
  }

  clone(): any {
    return new BridgedResponse({
      status: this.status,
      statusText: this.statusText,
      headers: Object.fromEntries(this.headers.entries()),
      body: this._bodyText,
      url: this.url
    })
  }

  // node-fetch Response compatibility methods
  buffer(): Promise<any> {
    if (!this._buffer) {
      // Use Uint8Array instead of Buffer for WebView compatibility
      const encoder = new TextEncoder()
      this._buffer = Promise.resolve(encoder.encode(this._bodyText))
    }
    return this._buffer
  }

  async textConverted(): Promise<string> {
    return this.text()
  }
}

/**
 * Creates a fetch function that proxies requests through the RN bridge.
 *
 * @param sendToRNAsync - The bridge messaging function (postMessage → response)
 * @returns A fetch-compatible function
 */
export const createBridgedFetch = (
  sendToRNAsync: (type: string, payload: any) => Promise<any>
): Fetch => {
  return async (
    input: FetchInput,
    init?: RequestInitWithCustomHeaders
  ): Promise<CustomResponse> => {
    // Normalize input to extract URL and merge with init
    let url: string
    let method = 'GET'
    let headers: Record<string, string> = {}
    let body: string | null = null

    if (typeof input === 'string') {
      url = input
    } else if (input instanceof URL) {
      url = input.toString()
    } else if (input && typeof input === 'object' && 'url' in input) {
      // Request-like object
      url = (input as any).url
      method = (input as any).method || 'GET'
      if ((input as any).headers) {
        if (typeof (input as any).headers.entries === 'function') {
          for (const [key, value] of (input as any).headers.entries()) {
            headers[key] = value
          }
        } else if (typeof (input as any).headers === 'object') {
          headers = { ...(input as any).headers }
        }
      }
    } else {
      url = String(input)
    }

    // Apply init overrides
    if (init) {
      if (init.method) method = init.method
      if (init.headers) {
        if (
          init.headers instanceof Headers ||
          typeof (init.headers as any).entries === 'function'
        ) {
          for (const [key, value] of (init.headers as any).entries()) {
            headers[key] = value
          }
        } else if (Array.isArray(init.headers)) {
          ;(init.headers as [string, string][]).forEach(([key, value]) => {
            headers[key] = value
          })
        } else if (typeof init.headers === 'object') {
          Object.assign(headers, init.headers)
        }
      }
      if (init.body !== undefined && init.body !== null) {
        if (typeof init.body === 'string') {
          body = init.body
        } else if (init.body instanceof Uint8Array) {
          // ethers.js sends JSON-RPC payloads as Uint8Array
          body = new TextDecoder().decode(init.body)
        } else if (init.body instanceof ArrayBuffer) {
          body = new TextDecoder().decode(new Uint8Array(init.body))
        } else if (typeof init.body === 'object' && init.body !== null) {
          // Check if it's an ArrayBuffer view (TypedArray)
          if (ArrayBuffer.isView(init.body)) {
            body = new TextDecoder().decode(init.body as any)
          } else {
            body = JSON.stringify(init.body)
          }
        } else {
          body = String(init.body)
        }
      }
    }

    // Send through bridge and reconstruct response
    const result = await sendToRNAsync('network.fetch', { url, method, headers, body })

    if (!result || typeof result.status !== 'number') {
      throw new Error(`Bridge returned invalid response for ${url}`)
    }

    return new BridgedResponse(result)
  }
}
