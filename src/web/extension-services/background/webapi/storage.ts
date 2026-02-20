import { Storage } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { browser, isExtension } from '@web/constants/browserapi'

const commonStorage = {
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

export const get = async (key: string, defaultValue?: any) => {
  const res = await browser.storage.local.get(key)

  if (!res[key]) return defaultValue

  return formatValue(res[key])
}

export const set = async (key: string, value: any): Promise<null> => {
  await browser.storage.local.set({
    [key]: typeof value === 'string' ? value : stringify(value)
  })
  return null
}

export const remove = async (key: string): Promise<null> => {
  await browser.storage.local.remove([key])
  return null
}

export const storage: Storage = isExtension ? { get, set, remove } : commonStorage

export default {
  get,
  set,
  remove,
  storage
}
