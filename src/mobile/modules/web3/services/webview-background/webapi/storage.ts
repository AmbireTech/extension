import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const get = async (prop?: string) => {
  const keys = storage.getAllKeys()
  const fullStorage: { [key: string]: string | undefined } = {}
  if (keys) {
    keys.forEach((key) => {
      fullStorage[key] = storage.getString(key)
    })
  }

  if (!prop) return fullStorage

  let result = storage.getString(prop)
  try {
    result = JSON.parse(result || '')
  } catch {
    // parsing failed, but that's fine, could be a string
  }

  return result
}

const set = async (prop, value): Promise<void> => {
  let val
  if (typeof value === 'string') {
    val = value
  } else {
    val = JSON.stringify(value)
  }

  storage.set(prop, val)
}

const byteInUse = async (): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (chrome) {
      chrome.storage.local.getBytesInUse((value) => {
        resolve(value)
      })
    } else {
      reject('ByteInUse only works in Chrome')
    }
  })
}

export default {
  get,
  set,
  byteInUse
}
