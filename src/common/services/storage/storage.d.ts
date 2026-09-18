import { SerializedStorageSnapshot } from './types'

export const storage: {
  get: (key: string, defaultValue?: any) => Promise<any>
  set: (key: string, value: any) => Promise<null>
  remove: (key: string) => Promise<null>
}
export const syncStorage: {
  get: (key: string, defaultValue?: any) => any
  set: (key: string, value: any) => void
  remove: (key: string) => void
}
export const syncSessionStorage: {
  get: (key: string, defaultValue?: any) => any
  set: (key: string, value: any) => void
  remove: (key: string) => void
}
export const secureStorage: {
  get: (key: string, prompt?: string) => Promise<string | null>
  set: (key: string, value: string) => Promise<void>
  remove: (key: string) => Promise<void>
}
// PERF: snapshot of the async storage as raw serialized strings, used to seed the
// mobile WebView worker's in-memory cache at init (see WebViewWorker). Only the keys
// in `keysToSnapshot` are read into `values`; every stored key still appears in
// `allKeys` so the worker knows which of the rest to fetch over the bridge.
export const getAllSerialized: (keysToSnapshot: readonly string[]) => SerializedStorageSnapshot
export type { SerializedStorageSnapshot }
