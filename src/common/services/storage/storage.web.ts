import { Storage, StorageProps } from '@ambire-common/interfaces/storage'
import { parseStorageValue, stringifyStorageValue } from '@ambire-common/libs/storage/serialization'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { browser, isExtension } from '@web/constants/browserapi'

import { SerializedStorageSnapshot } from './types'

function commonGet<K extends keyof StorageProps>(key: K): Promise<StorageProps[K] | undefined>
function commonGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: StorageProps[K]
): Promise<StorageProps[K]>
function commonGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: null
): Promise<StorageProps[K] | null>
function commonGet<K extends keyof StorageProps>(
  key: K,
  defaultValue?: StorageProps[K] | null
): Promise<StorageProps[K] | null | undefined> {
  const serialized = typeof localStorage !== 'undefined' ? localStorage.getItem(String(key)) : null
  return Promise.resolve(serialized ? parseStorageValue(String(key), serialized) : defaultValue)
}

const commonAsyncStorage: Storage = {
  get: commonGet,
  set: (key: string, value: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, stringifyStorageValue(key, value))
    }
    return Promise.resolve(null)
  },
  remove: (key: string) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key)
    }
    return Promise.resolve(null)
  }
}

/**
 * First characters of a serialized object or array. `set` stores strings raw, so a parse failure
 * is expected for a string, but text that starts with one of these is broken serialized data.
 */
const SERIALIZED_CONTAINER_START_CHARS = ['{', '[']

const formatValue = (key: string, value: any, defaultValue?: any) => {
  try {
    return typeof value === 'string' ? parseStorageValue(key, value) : value
  } catch (error: any) {
    const isBrokenSerializedValue =
      typeof value === 'string' && SERIALIZED_CONTAINER_START_CHARS.includes(value.charAt(0))
    if (isBrokenSerializedValue) {
      // Only the key and the error type: the parse error message can quote the stored value
      captureException(new Error(`Failed to parse the stored value of "${key}"`), {
        extra: { key, errorName: error?.name }
      })
    }
    return typeof value === 'string' ? value : defaultValue
  }
}

async function get<K extends keyof StorageProps>(key: K): Promise<StorageProps[K] | undefined>
async function get<K extends keyof StorageProps>(
  key: K,
  defaultValue: StorageProps[K]
): Promise<StorageProps[K]>
async function get<K extends keyof StorageProps>(
  key: K,
  defaultValue: null
): Promise<StorageProps[K] | null>
async function get<K extends keyof StorageProps>(
  key: K,
  defaultValue?: StorageProps[K] | null
): Promise<StorageProps[K] | null | undefined> {
  const res = await browser.storage.local.get(String(key))

  if (!res[String(key)]) return defaultValue

  return formatValue(String(key), res[String(key)])
}

const set = async (key: string, value: any): Promise<null> => {
  await browser.storage.local.set({
    [key]: typeof value === 'string' ? value : stringifyStorageValue(key, value)
  })
  return null
}

const remove = async (key: string): Promise<null> => {
  await browser.storage.local.remove([key])
  return null
}

const extensionAsyncStorage: Storage = { get, set, remove }

const asyncStorage: Storage = isExtension ? extensionAsyncStorage : commonAsyncStorage

const syncStorage = {
  get: (key: string, defaultValue?: any): any => {
    return localStorage.getItem(key) ?? defaultValue
  },
  set: (key: string, value: any) => {
    return localStorage.setItem(key, value)
  },
  remove: (key: string) => {
    return localStorage.removeItem(key)
  }
}

const syncSessionStorage = {
  get: (key: string, defaultValue?: any): any => {
    return sessionStorage.getItem(key) ?? defaultValue
  },
  set: (key: string, value: any) => {
    return sessionStorage.setItem(key, value)
  },
  remove: (key: string) => {
    return sessionStorage.removeItem(key)
  }
}

const secureStorage = {
  get: (key: string) => {
    console.warn(`Secure storage is not supported on web. Attempted to get key: ${key}`)
    return Promise.resolve(null)
  },
  set: (key: string) => {
    console.warn(`Secure storage is not supported on web. Attempted to set key: ${key}`)
    return Promise.resolve()
  },
  remove: (key: string) => {
    console.warn(`Secure storage is not supported on web. Attempted to remove key: ${key}`)
    return Promise.resolve()
  }
}

// PERF: mobile-only optimization (seeds the WebView worker's storage cache).
// On web/extension there is no such worker bridge, so this is a no-op.
const getAllSerialized = (): SerializedStorageSnapshot => ({ values: {}, allKeys: [] })

export { asyncStorage as storage, syncStorage, syncSessionStorage, secureStorage, getAllSerialized }
