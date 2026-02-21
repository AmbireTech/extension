import { Storage } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { browser, isExtension } from '@web/constants/browserapi'

const commonAsyncStorage: Storage = {
  get: (key: string, defaultValue: any): any => {
    const serialized = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    return Promise.resolve(serialized ? parse(serialized) : defaultValue)
  },
  set: (key: string, value: any) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, stringify(value))
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

const formatValue = (value: any, defaultValue?: any) => {
  try {
    return typeof value === 'string' ? parse(value) : value
  } catch (error) {
    return typeof value === 'string' ? value : defaultValue
  }
}

const get = async (key: string, defaultValue?: any) => {
  const res = await browser.storage.local.get(key)

  if (!res[key]) return defaultValue

  return formatValue(res[key])
}

const set = async (key: string, value: any): Promise<null> => {
  await browser.storage.local.set({
    [key]: typeof value === 'string' ? value : stringify(value)
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
  get: (key: string, defaultValue: any): any => {
    return localStorage.get(key, defaultValue)
  },
  set: (key: string, value: any) => {
    return localStorage.set(key, value)
  },
  remove: (key: string) => {
    return localStorage.remove(key)
  }
}

const syncSessionStorage = {
  get: (key: string, defaultValue: any): any => {
    return sessionStorage.get(key, defaultValue)
  },
  set: (key: string, value: any) => {
    return sessionStorage.set(key, value)
  },
  remove: (key: string) => {
    return sessionStorage.remove(key)
  }
}

export { asyncStorage as storage, syncStorage, syncSessionStorage }
