import { SpeculosClientOptions } from './types'

export class LedgerSimulatorClient {
  private baseUrl: string
  private timeout: number

  constructor(options: SpeculosClientOptions) {
    this.baseUrl = options.baseUrl ?? 'http://127.0.0.1:5000'
    this.timeout = options.timeoutMS ?? 5000
  }

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null

    const timeoutId =
      controller && this.timeout > 0 ? setTimeout(() => controller.abort(), this.timeout) : null

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        signal: controller?.signal
      })

      if (!res.ok) {
        throw new Error(`Speculos ${options.method ?? 'GET'} ${path} failed: ${res.status}`)
      }

      if (res.status === 204) return undefined as T

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        return await res.json()
      }

      return undefined as T
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  async post<T = void>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
  }

  async getJson<T>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'GET'
    })
  }

  async delete<T = void>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE'
    })
  }
}
