import { Storage, StorageProps } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { browser, isExtension } from '@web/constants/browserapi'

function benzinGet<K extends keyof StorageProps>(key: K): Promise<StorageProps[K] | undefined>
function benzinGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: StorageProps[K]
): Promise<StorageProps[K]>
function benzinGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: null
): Promise<StorageProps[K] | null>
function benzinGet<K extends keyof StorageProps>(
  key: K,
  defaultValue?: StorageProps[K] | null
): Promise<StorageProps[K] | null | undefined> {
  const serialized = sessionStorage.getItem(String(key))
  return Promise.resolve(serialized ? parse(serialized) : defaultValue)
}

const benzinStorage: Storage = {
  get: benzinGet,
  set: (key: string, value: any) => {
    sessionStorage.setItem(key, stringify(value))
    return Promise.resolve(null)
  },
  remove: (key: string) => {
    sessionStorage.removeItem(key)
    return Promise.resolve(null)
  }
}

const formatValue = (value: any, defaultValue?: any) => {
  try {
    return typeof value === 'string' ? parse(value) : value
  } catch (error) {
    return typeof value === 'string' ? value : defaultValue
  }
}

export const get = async (key?: string, defaultValue?: any) => {
  const res = await browser.storage.session.get(null)

  if (!key) {
    return Object.fromEntries(Object.entries(res).map(([k, value]) => [k, formatValue(value)]))
  }

  if (!res[key]) return defaultValue

  return formatValue(res[key])
}

async function storageGet<K extends keyof StorageProps>(
  key: K
): Promise<StorageProps[K] | undefined>
async function storageGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: StorageProps[K]
): Promise<StorageProps[K]>
async function storageGet<K extends keyof StorageProps>(
  key: K,
  defaultValue: null
): Promise<StorageProps[K] | null>
async function storageGet<K extends keyof StorageProps>(
  key: K,
  defaultValue?: StorageProps[K] | null
): Promise<StorageProps[K] | null | undefined> {
  const res = await browser.storage.session.get(String(key))

  if (!res[String(key)]) return defaultValue

  return formatValue(res[String(key)])
}

export const set = async (key: string, value: any): Promise<null> => {
  await browser.storage.session.set({
    [key]: typeof value === 'string' ? value : stringify(value)
  })
  return null
}

export const remove = async (key: string): Promise<null> => {
  await browser.storage.session.remove([key])
  return null
}

export const storage: Storage = isExtension ? { get: storageGet, set, remove } : benzinStorage

export default {
  get,
  set,
  remove,
  storage
}
