import { createMMKV, MMKV } from 'react-native-mmkv'

import { Storage } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'

const asyncStorageInstance: MMKV = createMMKV({ id: 'asyncStorage' })
asyncStorageInstance.clearAll()
const syncStorageInstance: MMKV = createMMKV({ id: 'syncStorage' })
// NOTE: for testing while settings are still not implemented
// syncStorageInstance.set('fallbackSelectedThemeType', 'light')
// syncStorageInstance.set('fallbackSelectedThemeType', 'dark')

const syncSessionStorageInstance: MMKV = createMMKV({ id: 'syncSessionStorage' })
// Clearing it on initialization ensures it starts empty when the app is launched.
syncSessionStorageInstance.clearAll()

const storage: Storage = {
  get: (key: string, defaultValue: any): any => {
    const serialized = asyncStorageInstance.getString(key)
    return Promise.resolve(serialized ? parse(serialized) : defaultValue)
  },
  set: (key: string, value: any) => {
    asyncStorageInstance.set(key, stringify(value))
    return Promise.resolve(null)
  },
  remove: (key: string) => {
    asyncStorageInstance.remove(key)
    return Promise.resolve(null)
  }
}

const syncStorage = {
  get: (key: string, defaultValue?: any): any => {
    return syncStorageInstance.getString(key) ?? defaultValue
  },
  set: (key: string, value: string) => {
    return syncStorageInstance.set(key, value)
  },
  remove: (key: string) => {
    return syncStorageInstance.remove(key)
  }
}

const syncSessionStorage = {
  get: (key: string, defaultValue?: any): any => {
    return syncSessionStorageInstance.getString(key) ?? defaultValue
  },
  set: (key: string, value: string) => {
    return syncSessionStorageInstance.set(key, value)
  },
  remove: (key: string) => {
    return syncSessionStorageInstance.remove(key)
  }
}

export { storage, syncStorage, syncSessionStorage }
