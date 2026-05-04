import * as SecureStore from 'expo-secure-store'
import { createMMKV, MMKV } from 'react-native-mmkv'

import { Storage } from '@ambire-common/interfaces/storage'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'

const asyncStorageInstance: MMKV = createMMKV({ id: 'asyncStorage' })
const syncStorageInstance: MMKV = createMMKV({ id: 'syncStorage' })
// NOTE: for testing while settings are still not implemented
// syncStorageInstance.set('fallbackSelectedThemeType', 'light')
// syncStorageInstance.set('fallbackSelectedThemeType', 'dark')

const syncSessionStorageInstance: MMKV = createMMKV({ id: 'syncSessionStorage' })
// Clearing it on initialization ensures it starts empty when the app is launched.
syncSessionStorageInstance.clearAll()

const clearAllStorages = () => {
  asyncStorageInstance.clearAll()
  syncStorageInstance.clearAll()
  syncSessionStorageInstance.clearAll()
}

// clearAllStorages()

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

const secureStorage = {
  get: async (key: string, prompt?: string) => {
    return SecureStore.getItemAsync(key, {
      requireAuthentication: true,
      authenticationPrompt: prompt,
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    })
  },
  set: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      requireAuthentication: true
    })
  },
  remove: async (key: string) => {
    await SecureStore.deleteItemAsync(key)
  }
}

export { storage, syncStorage, syncSessionStorage, secureStorage }
