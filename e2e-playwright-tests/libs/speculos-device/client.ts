import { SpeculosClientOptions } from './types'

export class LedgerSimulatorClient {
  private baseUrl: string
  private timeout: number

  constructor(options: SpeculosClientOptions) {
    this.baseUrl = options.baseUrl ?? 'http://127.0.0.1:5000'
    this.timeout = options.timeoutMS ?? 5000
  }

  async post<T = void>(path: string, body?: any): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })

      if (!res.ok) {
        throw new Error(`Speculos POST ${path} failed: ${res.status}`)
      }

      if (res.headers.get('content-type')?.includes('application/json')) {
        return (await res.json()) as T
      }

      return (await res.json()) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
