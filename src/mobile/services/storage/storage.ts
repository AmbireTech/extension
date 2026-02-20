import { createMMKV, MMKV } from 'react-native-mmkv'

import { Storage } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'

const instance: MMKV = createMMKV()

const storage: Storage = {
  get: (key: string, defaultValue: any): any => {
    const serialized = instance.getString(key)
    return Promise.resolve(serialized ? parse(serialized) : defaultValue)
  },
  set: (key: string, value: any) => {
    instance.set(key, stringify(value))
    return Promise.resolve(null)
  },
  remove: (key: string) => {
    instance.remove(key)
    return Promise.resolve(null)
  }
}

const syncStorage = {
  getItem: (key: string) => instance.getString(key) || null,
  setItem: (key: string, value: string) => instance.set(key, value)
}

export { storage, syncStorage }
